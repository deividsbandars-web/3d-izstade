import { useState } from 'react';
import type { ModularHomeConfiguratorState } from './modularHomeConfigurator';
import { formatHomeEstimateEur, type ModularHomeEstimate } from './modularHomeEstimate';
import {
  createModularHomeProjectComparison,
  createModularHomeLocalProject,
  deleteModularHomeLocalProject,
  duplicateModularHomeLocalProject,
  getModularHomeLocalProjects,
  renameModularHomeLocalProject,
  saveModularHomeLocalProject,
  type ModularHomeLocalProject,
  type ModularHomeProjectComparisonDeltaStatus,
  type ModularHomeProjectQuoteStatus,
} from './modularHomeWorkspaceStorage';
import type { ModularHomeProductId } from './modularHomeProducts';

type ModularHomeProjectWorkspaceProps = {
  config: ModularHomeConfiguratorState;
  estimate: ModularHomeEstimate;
  isTouchDevice?: boolean;
  onLoadProject: (config: ModularHomeConfiguratorState) => void;
  productId: ModularHomeProductId;
};

const QUOTE_STATUS_LABEL: Record<ModularHomeProjectQuoteStatus, string> = {
  localPreviewSaved: 'Local quote saved',
  notRequested: 'Quote not requested',
};

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function createProjectLabel(project: ModularHomeLocalProject): string {
  return project.projectName;
}

function formatSignedEstimateDelta(value: number): string {
  return `${value >= 0 ? '+' : ''}${formatHomeEstimateEur(value)}`;
}

function formatSignedNumber(value: number): string {
  if (value === 0) {
    return '0';
  }

  return `${value > 0 ? '+' : ''}${value.toLocaleString('en-IE', { maximumFractionDigits: 2 })}`;
}

function formatQuantity(value: number, unit?: string): string {
  const formatted = value.toLocaleString('en-IE', { maximumFractionDigits: 2 });

  return unit ? `${formatted} ${unit}` : formatted;
}

const DELTA_STATUS_LABELS = {
  added: 'Added',
  changed: 'Changed',
  removed: 'Removed',
  same: 'Same',
} as const satisfies Record<ModularHomeProjectComparisonDeltaStatus, string>;

const DELTA_STATUS_STYLES = {
  added: {
    background: 'rgba(34, 197, 94, 0.13)',
    border: '1px solid rgba(74, 222, 128, 0.24)',
    color: '#bbf7d0',
  },
  changed: {
    background: 'rgba(251, 191, 36, 0.12)',
    border: '1px solid rgba(251, 191, 36, 0.24)',
    color: '#fde68a',
  },
  removed: {
    background: 'rgba(248, 113, 113, 0.13)',
    border: '1px solid rgba(252, 165, 165, 0.24)',
    color: '#fecaca',
  },
  same: {
    background: 'rgba(148, 163, 184, 0.1)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    color: '#cbd5e1',
  },
} as const satisfies Record<ModularHomeProjectComparisonDeltaStatus, { background: string; border: string; color: string }>;

function createDeltaStatusStyle(status: ModularHomeProjectComparisonDeltaStatus, isTouchDevice: boolean) {
  return {
    ...DELTA_STATUS_STYLES[status],
    borderRadius: '999px',
    fontSize: isTouchDevice ? '0.46rem' : '0.5rem',
    fontWeight: 950,
    letterSpacing: '0.06em',
    lineHeight: 1,
    padding: '4px 6px',
    textTransform: 'uppercase' as const,
    whiteSpace: 'nowrap' as const,
  };
}

function stopWorkspaceEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export function ModularHomeProjectWorkspace({
  config,
  estimate,
  isTouchDevice = false,
  onLoadProject,
  productId,
}: ModularHomeProjectWorkspaceProps) {
  const [error, setError] = useState('');
  const [compareProjectIds, setCompareProjectIds] = useState<[string, string]>(['', '']);
  const [projects, setProjects] = useState(() => getModularHomeLocalProjects());
  const [renamingProjectId, setRenamingProjectId] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [success, setSuccess] = useState('');
  const compareFirstProject = projects.find((project) => project.projectId === compareProjectIds[0]);
  const compareSecondProject = projects.find((project) => project.projectId === compareProjectIds[1]);
  const comparison = compareFirstProject && compareSecondProject
    ? createModularHomeProjectComparison(compareFirstProject, compareSecondProject)
    : null;
  const changedComparisonOptions = comparison?.options.filter((option) => option.hasChanged) ?? [];
  const changedMajorBomCategoryDeltas = comparison?.majorBomCategoryDeltas.filter((item) => item.status !== 'same') ?? [];
  const changedModuleDeltas = comparison?.moduleDeltas.filter((item) => item.status !== 'same') ?? [];
  const changedComponentDeltas = comparison?.componentDeltas.filter((item) => item.status !== 'same') ?? [];

  const refreshProjects = () => {
    setProjects(getModularHomeLocalProjects());
  };

  const saveCurrentProject = () => {
    const project = createModularHomeLocalProject({
      config,
      estimateTotal: estimate.estimatedTotal,
      productId,
      projectName: `${estimate.baseModel} ${new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}`,
      quoteStatus: 'notRequested',
    });

    if (!saveModularHomeLocalProject(project)) {
      setSuccess('');
      setError('Could not save this project locally. Browser storage may be disabled or full.');
      return;
    }

    setError('');
    setSelectedProjectId(project.projectId);
    setSuccess('Project saved locally.');
    refreshProjects();
  };

  const loadProject = (project: ModularHomeLocalProject) => {
    onLoadProject(project.config);
    setSelectedProjectId(project.projectId);
    setError('');
    setSuccess('Project restored into the preview configurator.');
  };

  const duplicateProject = (projectId: string) => {
    const duplicate = duplicateModularHomeLocalProject(projectId);

    if (!duplicate) {
      setSuccess('');
      setError('Could not duplicate this project locally.');
      return;
    }

    setError('');
    setSelectedProjectId(duplicate.projectId);
    setSuccess('Project duplicated locally.');
    refreshProjects();
  };

  const beginRenameProject = (project: ModularHomeLocalProject) => {
    setRenamingProjectId(project.projectId);
    setRenameValue(project.projectName);
    setError('');
    setSuccess('');
  };

  const saveProjectRename = (projectId: string) => {
    if (renameValue.trim().length === 0) {
      setSuccess('');
      setError('Project name is required.');
      return;
    }

    const renamed = renameModularHomeLocalProject(projectId, renameValue);

    if (!renamed) {
      setSuccess('');
      setError('Could not rename this project locally.');
      return;
    }

    setError('');
    setRenamingProjectId('');
    setRenameValue('');
    setSelectedProjectId(renamed.projectId);
    setSuccess('Project renamed locally.');
    refreshProjects();
  };

  const removeProject = (projectId: string) => {
    if (!deleteModularHomeLocalProject(projectId)) {
      setSuccess('');
      setError('Could not delete this project locally.');
      return;
    }

    setError('');
    setSelectedProjectId((current) => (current === projectId ? '' : current));
    setSuccess('Project deleted locally.');
    refreshProjects();
  };

  const buttonStyle = {
    borderRadius: '999px',
    cursor: 'pointer',
    font: 'inherit',
    fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
    fontWeight: 900,
    letterSpacing: '0.06em',
    padding: isTouchDevice ? '6px 8px' : '7px 9px',
    textTransform: 'uppercase',
  } as const;

  return (
    <section
      aria-label="Local Modular Home project workspace"
      data-home-project-workspace="true"
      data-home-project-workspace-count={projects.length}
      onClick={stopWorkspaceEvent}
      onMouseDown={stopWorkspaceEvent}
      onPointerDown={stopWorkspaceEvent}
      style={{
        background: 'linear-gradient(180deg, rgba(20, 83, 45, 0.28), rgba(2, 6, 23, 0.58))',
        border: '1px solid rgba(34, 197, 94, 0.26)',
        borderRadius: isTouchDevice ? '15px' : '17px',
        marginTop: isTouchDevice ? '10px' : '12px',
        padding: isTouchDevice ? '10px' : '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
        <div>
          <div style={{ color: '#86efac', fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Local project workspace
          </div>
          <div style={{ color: '#f0fdf4', fontSize: isTouchDevice ? '0.78rem' : '0.86rem', fontWeight: 950, marginTop: '4px' }}>
            Save and compare home configs
          </div>
        </div>
        <div
          data-home-project-workspace-total={projects.length}
          style={{
            background: 'rgba(15, 23, 42, 0.58)',
            border: '1px solid rgba(34, 197, 94, 0.26)',
            borderRadius: '999px',
            color: '#bbf7d0',
            fontSize: '0.54rem',
            fontWeight: 950,
            padding: '5px 7px',
            whiteSpace: 'nowrap',
          }}
        >
          {projects.length} saved
        </div>
      </div>

      <div
        data-home-project-workspace-current="true"
        data-home-project-workspace-current-product={productId}
        data-home-project-workspace-current-total={estimate.estimatedTotal}
        style={{
          background: 'rgba(15, 23, 42, 0.44)',
          border: '1px solid rgba(34, 197, 94, 0.16)',
          borderRadius: '12px',
          color: '#dcfce7',
          fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
          fontWeight: 820,
          lineHeight: 1.35,
          marginTop: '9px',
          padding: isTouchDevice ? '8px 9px' : '9px 10px',
        }}
      >
        Current: {estimate.baseModel} / {formatHomeEstimateEur(estimate.estimatedTotal)} / local only
      </div>

      <button
        type="button"
        data-home-project-workspace-save="true"
        onClick={(event) => {
          event.stopPropagation();
          saveCurrentProject();
        }}
        style={{
          ...buttonStyle,
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(45, 212, 191, 0.88))',
          border: 'none',
          color: '#052e16',
          marginTop: '9px',
          width: '100%',
        }}
      >
        Save current project
      </button>

      <div
        aria-label="Compare saved Modular Home projects"
        data-home-project-workspace-compare="true"
        data-home-project-workspace-compare-ready={comparison ? 'true' : 'false'}
        style={{
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(125, 211, 252, 0.16)',
          borderRadius: '12px',
          display: 'grid',
          gap: '8px',
          marginTop: isTouchDevice ? '9px' : '10px',
          padding: isTouchDevice ? '8px 9px' : '9px 10px',
        }}
      >
        <div style={{ color: '#7dd3fc', fontSize: '0.56rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Compare projects
        </div>
        <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.54rem' : '0.58rem', fontWeight: 780, lineHeight: 1.28 }}>
          Select two saved local projects to compare configuration and estimate totals.
        </div>
        <div style={{ display: 'grid', gap: '6px', gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
          {(['First project', 'Second project'] as const).map((label, index) => (
            <label
              key={label}
              style={{
                color: '#dcfce7',
                display: 'grid',
                fontSize: isTouchDevice ? '0.54rem' : '0.58rem',
                fontWeight: 850,
                gap: '4px',
              }}
            >
              {label}
              <select
                data-home-project-workspace-compare-select={index === 0 ? 'first' : 'second'}
                value={compareProjectIds[index]}
                onChange={(event) => {
                  const nextIds: [string, string] = [...compareProjectIds];
                  nextIds[index] = event.currentTarget.value;
                  setCompareProjectIds(nextIds);
                }}
                style={{
                  background: 'rgba(15, 23, 42, 0.74)',
                  border: '1px solid rgba(125, 211, 252, 0.18)',
                  borderRadius: '9px',
                  color: '#e0f2fe',
                  font: 'inherit',
                  fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
                  padding: '7px 8px',
                }}
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.projectId} value={project.projectId}>
                    {project.projectName} / {formatHomeEstimateEur(project.estimateTotal)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        {comparison ? (
          <div
            data-home-project-workspace-compare-result="true"
            data-home-project-workspace-compare-delta={comparison.estimateDelta}
            data-home-project-workspace-compare-changed-options={comparison.changedOptionCount}
            data-home-project-workspace-compare-component-delta={comparison.bomSummary.componentSubtotalDelta}
            data-home-project-workspace-compare-module-delta={comparison.bomSummary.moduleCountDelta}
            style={{
              background: 'rgba(2, 6, 23, 0.22)',
              border: '1px solid rgba(125, 211, 252, 0.14)',
              borderRadius: '10px',
              display: 'grid',
              gap: '8px',
              padding: isTouchDevice ? '7px 8px' : '8px 9px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'start' }}>
              <span style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 920 }}>
                {comparison.savedProject.projectName} vs {comparison.currentProject.projectName}
              </span>
              <span style={{ color: comparison.estimateDelta >= 0 ? '#fef3c7' : '#bbf7d0', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 950, whiteSpace: 'nowrap' }}>
                {formatSignedEstimateDelta(comparison.estimateDelta)}
              </span>
            </div>
            <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.52rem' : '0.56rem', fontWeight: 780, lineHeight: 1.28 }}>
              {comparison.savedProject.projectName}: {formatHomeEstimateEur(comparison.savedProject.estimateTotal)} / {comparison.currentProject.projectName}: {formatHomeEstimateEur(comparison.currentProject.estimateTotal)}
            </div>

            <div
              aria-label="Project comparison side-by-side summary"
              data-home-project-workspace-compare-side-by-side="true"
              style={{
                display: 'grid',
                gap: '7px',
                gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))',
              }}
            >
              {[
                { label: 'Saved baseline', summary: comparison.savedSummary },
                { label: 'Comparison project', summary: comparison.currentSummary },
              ].map(({ label, summary }) => (
                <div
                  key={summary.projectId}
                  data-home-project-workspace-compare-side={`${label}:${summary.projectId}:${summary.moduleCount}:${summary.estimateTotal}`}
                  style={{
                    background: 'rgba(15, 23, 42, 0.38)',
                    border: '1px solid rgba(125, 211, 252, 0.13)',
                    borderRadius: '10px',
                    display: 'grid',
                    gap: '6px',
                    padding: '7px 8px',
                  }}
                >
                  <div style={{ color: '#93c5fd', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {label}
                  </div>
                  <div style={{ color: '#f0f9ff', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 950, lineHeight: 1.2 }}>
                    {summary.projectName}
                  </div>
                  <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 780, lineHeight: 1.35 }}>
                    {summary.product}<br />
                    Layout: {summary.layoutVariant}<br />
                    Facade/roof: {summary.facade} / {summary.roof}<br />
                    Terrace/finish: {summary.terrace} / {summary.finishLevel}<br />
                    Windows/doors: {summary.windowPackage} / {summary.doorPackage}<br />
                    Placement: {summary.windowPlacement} / {summary.doorPlacement}
                  </div>
                  <div
                    data-home-project-workspace-compare-confidence-summary={`${summary.projectId}:${summary.confidenceSummary.reviewLineCount}:${summary.confidenceSummary.siteDependentLineCount}`}
                    style={{
                      background: 'rgba(2, 6, 23, 0.28)',
                      border: '1px solid rgba(125, 211, 252, 0.1)',
                      borderRadius: '8px',
                      color: '#dbeafe',
                      display: 'grid',
                      fontSize: isTouchDevice ? '0.48rem' : '0.52rem',
                      fontWeight: 780,
                      gap: '3px',
                      lineHeight: 1.25,
                      padding: '6px 7px',
                    }}
                  >
                    <span>Modules: {summary.moduleCount} / Component BOM: {formatHomeEstimateEur(summary.componentSubtotal)}</span>
                    <span>Estimate: {formatHomeEstimateEur(summary.estimateTotal)}</span>
                    <span>Confidence: {summary.confidenceSummary.confidenceLabels.join(', ')}</span>
                    <span>Review lines: {summary.confidenceSummary.reviewLineCount} engineering / {summary.confidenceSummary.siteDependentLineCount} site-dependent</span>
                  </div>
                </div>
              ))}
            </div>

            <div
              aria-label="Project comparison price and BOM summary"
              data-home-project-workspace-compare-bom-summary="true"
              style={{
                display: 'grid',
                gap: '6px',
                gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))',
              }}
            >
              {[
                ['Estimate delta', formatSignedEstimateDelta(comparison.estimateDelta)],
                ['Component BOM delta', formatSignedEstimateDelta(comparison.bomSummary.componentSubtotalDelta)],
                ['Module count delta', formatSignedNumber(comparison.bomSummary.moduleCountDelta)],
                ['Component quantity delta', formatSignedNumber(comparison.bomSummary.totalQuantityDelta)],
                ['Material delta', formatSignedEstimateDelta(comparison.bomSummary.materialCostDelta)],
                ['Labor delta', formatSignedEstimateDelta(comparison.bomSummary.laborCostDelta)],
                ['Engineering-review delta', formatSignedNumber(comparison.currentSummary.confidenceSummary.reviewLineCount - comparison.savedSummary.confidenceSummary.reviewLineCount)],
                ['Site-dependent delta', formatSignedNumber(comparison.currentSummary.confidenceSummary.siteDependentLineCount - comparison.savedSummary.confidenceSummary.siteDependentLineCount)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  data-home-project-workspace-compare-summary-item={`${label}:${value}`}
                  style={{
                    background: 'rgba(15, 23, 42, 0.34)',
                    border: '1px solid rgba(125, 211, 252, 0.12)',
                    borderRadius: '9px',
                    display: 'grid',
                    gap: '3px',
                    padding: '6px 7px',
                  }}
                >
                  <span style={{ color: '#93c5fd', fontSize: '0.48rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
                  <span style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 950 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gap: '5px' }}>
              <div style={{ color: '#93c5fd', fontSize: '0.52rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Changed options ({comparison.changedOptionCount})
              </div>
              {changedComparisonOptions.length > 0 ? changedComparisonOptions.map((option) => (
                <div
                  key={option.key}
                  data-home-project-workspace-compare-option={`${option.key}:changed:${option.savedValue}:${option.currentValue}`}
                  style={{
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.18)',
                    borderRadius: '8px',
                    color: '#fde68a',
                    display: 'grid',
                    fontSize: isTouchDevice ? '0.5rem' : '0.54rem',
                    fontWeight: 780,
                    gap: '3px',
                    padding: '5px 6px',
                  }}
                >
                  <span style={{ color: '#e0f2fe', fontWeight: 900 }}>{option.label}</span>
                  <span>{option.savedValue} {'->'} {option.currentValue}</span>
                </div>
              )) : (
                <div data-home-project-workspace-compare-options-unchanged="true" style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 780 }}>
                  Product options match.
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: '5px' }}>
              <div style={{ color: '#93c5fd', fontSize: '0.52rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Major BOM categories
              </div>
              {changedMajorBomCategoryDeltas.length > 0 ? changedMajorBomCategoryDeltas.slice(0, 8).map((item) => (
                <div
                  key={item.category}
                  data-home-project-workspace-compare-bom-category={`${item.category}:${item.status}:${item.savedQuantity}:${item.currentQuantity}:${item.costDelta}`}
                  style={{
                    background: 'rgba(15, 23, 42, 0.32)',
                    border: '1px solid rgba(125, 211, 252, 0.12)',
                    borderRadius: '8px',
                    display: 'grid',
                    gap: '4px',
                    padding: '5px 6px',
                  }}
                >
                  <div style={{ alignItems: 'center', display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
                    <span style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 900 }}>{item.label}</span>
                    <span style={createDeltaStatusStyle(item.status, isTouchDevice)}>{DELTA_STATUS_LABELS[item.status]}</span>
                  </div>
                  <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.48rem' : '0.52rem', fontWeight: 760 }}>
                    Qty {formatQuantity(item.savedQuantity, item.unit)} {'->'} {formatQuantity(item.currentQuantity, item.unit)} / {formatSignedEstimateDelta(item.costDelta)}
                  </div>
                </div>
              )) : (
                <div data-home-project-workspace-compare-bom-categories-unchanged="true" style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 780 }}>
                  Major BOM categories are unchanged.
                </div>
              )}
            </div>

            <div
              data-home-project-workspace-compare-confidence-notes="true"
              style={{
                background: 'rgba(30, 41, 59, 0.34)',
                border: '1px solid rgba(125, 211, 252, 0.13)',
                borderRadius: '9px',
                color: '#dbeafe',
                display: 'grid',
                fontSize: isTouchDevice ? '0.5rem' : '0.54rem',
                fontWeight: 780,
                gap: '4px',
                lineHeight: 1.3,
                padding: '6px 7px',
              }}
            >
              <div style={{ color: '#93c5fd', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Estimate confidence notes
              </div>
              {comparison.confidenceNotes.map((note) => (
                <div key={note} data-home-project-workspace-compare-confidence-note={note}>
                  {note}
                </div>
              ))}
              <div data-home-project-workspace-compare-recommendation="true" style={{ color: '#fef3c7', fontWeight: 900 }}>
                {comparison.recommendationNote}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '5px' }}>
              <div style={{ color: '#93c5fd', fontSize: '0.52rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Added/removed modules
              </div>
              {changedModuleDeltas.length > 0 ? changedModuleDeltas.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  data-home-project-workspace-compare-module={`${item.id}:${item.status}:${item.savedQuantity}:${item.currentQuantity}:${item.costDelta}`}
                  style={{
                    background: 'rgba(15, 23, 42, 0.32)',
                    border: '1px solid rgba(125, 211, 252, 0.12)',
                    borderRadius: '8px',
                    display: 'grid',
                    gap: '4px',
                    padding: '5px 6px',
                  }}
                >
                  <div style={{ alignItems: 'center', display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
                    <span style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 900 }}>{item.label}</span>
                    <span style={createDeltaStatusStyle(item.status, isTouchDevice)}>{DELTA_STATUS_LABELS[item.status]}</span>
                  </div>
                  <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.48rem' : '0.52rem', fontWeight: 760 }}>
                    Qty {formatQuantity(item.savedQuantity)} {'->'} {formatQuantity(item.currentQuantity)} / {item.moduleType} / {formatSignedEstimateDelta(item.costDelta)}
                  </div>
                </div>
              )) : (
                <div data-home-project-workspace-compare-modules-unchanged="true" style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 780 }}>
                  Module package is unchanged.
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: '5px' }}>
              <div style={{ color: '#93c5fd', fontSize: '0.52rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Component BOM main differences
              </div>
              {changedComponentDeltas.length > 0 ? changedComponentDeltas.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  data-home-project-workspace-compare-component={`${item.id}:${item.status}:${item.savedQuantity}:${item.currentQuantity}:${item.costDelta}`}
                  style={{
                    background: 'rgba(15, 23, 42, 0.32)',
                    border: '1px solid rgba(125, 211, 252, 0.12)',
                    borderRadius: '8px',
                    display: 'grid',
                    gap: '4px',
                    padding: '5px 6px',
                  }}
                >
                  <div style={{ alignItems: 'center', display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
                    <span style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 900 }}>{item.label}</span>
                    <span style={createDeltaStatusStyle(item.status, isTouchDevice)}>{DELTA_STATUS_LABELS[item.status]}</span>
                  </div>
                  <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.48rem' : '0.52rem', fontWeight: 760 }}>
                    {item.category} / Qty {formatQuantity(item.savedQuantity, item.unit)} {'->'} {formatQuantity(item.currentQuantity, item.unit)} / {formatSignedEstimateDelta(item.costDelta)}
                  </div>
                </div>
              )) : (
                <div data-home-project-workspace-compare-components-unchanged="true" style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 780 }}>
                  Component BOM preview is unchanged.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div data-home-project-workspace-compare-empty="true" style={{ color: '#a7f3d0', fontSize: isTouchDevice ? '0.54rem' : '0.58rem', fontWeight: 800, lineHeight: 1.28 }}>
            Save at least two projects, then select both to compare.
          </div>
        )}
      </div>

      {error ? (
        <div data-home-project-workspace-error="true" style={{ color: '#fecaca', fontSize: '0.6rem', fontWeight: 900, marginTop: '8px' }}>
          {error}
        </div>
      ) : null}

      {success ? (
        <div data-home-project-workspace-success="true" style={{ color: '#bbf7d0', fontSize: '0.6rem', fontWeight: 900, marginTop: '8px' }}>
          {success}
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: '8px', marginTop: isTouchDevice ? '9px' : '10px' }}>
        {projects.length === 0 ? (
          <div
            data-home-project-workspace-empty="true"
            style={{
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(148, 163, 184, 0.16)',
              borderRadius: '12px',
              color: '#bbf7d0',
              fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
              fontWeight: 820,
              lineHeight: 1.32,
              padding: isTouchDevice ? '8px 9px' : '9px 10px',
            }}
          >
            No saved local projects yet. Save the current configuration to compare options.
          </div>
        ) : (
          projects.map((project) => {
            const isSelected = project.projectId === selectedProjectId;

            return (
              <article
                key={project.projectId}
                data-home-project-workspace-item={project.projectId}
                data-home-project-workspace-item-product={project.productId}
                data-home-project-workspace-item-total={project.estimateTotal}
                data-home-project-workspace-item-quote-status={project.quoteStatus}
                style={{
                  background: isSelected ? 'rgba(34, 197, 94, 0.16)' : 'rgba(15, 23, 42, 0.48)',
                  border: isSelected ? '1px solid rgba(34, 197, 94, 0.42)' : '1px solid rgba(148, 163, 184, 0.16)',
                  borderRadius: '12px',
                  display: 'grid',
                  gap: '7px',
                  padding: isTouchDevice ? '8px 9px' : '9px 10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start' }}>
                  <div>
                    <div style={{ color: '#f0fdf4', fontSize: isTouchDevice ? '0.62rem' : '0.66rem', fontWeight: 950, lineHeight: 1.2 }}>
                      {createProjectLabel(project)}
                    </div>
                    <div style={{ color: '#a7f3d0', fontSize: isTouchDevice ? '0.52rem' : '0.56rem', fontWeight: 820, lineHeight: 1.28, marginTop: '3px' }}>
                      {project.productId} / {formatHomeEstimateEur(project.estimateTotal)}<br />
                      Updated {formatDateTime(project.updatedAt)}
                    </div>
                  </div>
                  <div style={{ color: '#bbf7d0', fontSize: '0.52rem', fontWeight: 950, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {QUOTE_STATUS_LABEL[project.quoteStatus]}
                  </div>
                </div>

                {renamingProjectId === project.projectId ? (
                  <div
                    data-home-project-workspace-rename-panel={project.projectId}
                    style={{
                      display: 'grid',
                      gap: '6px',
                      gridTemplateColumns: isTouchDevice ? '1fr' : '1fr auto auto',
                    }}
                  >
                    <input
                      aria-label="Project name"
                      data-home-project-workspace-rename-input={project.projectId}
                      maxLength={80}
                      onChange={(event) => {
                        setRenameValue(event.currentTarget.value);
                      }}
                      value={renameValue}
                      style={{
                        background: 'rgba(15, 23, 42, 0.72)',
                        border: '1px solid rgba(34, 197, 94, 0.24)',
                        borderRadius: '9px',
                        color: '#f0fdf4',
                        font: 'inherit',
                        fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
                        fontWeight: 820,
                        padding: '7px 8px',
                      }}
                    />
                    <button
                      type="button"
                      data-home-project-workspace-rename-save={project.projectId}
                      onClick={(event) => {
                        event.stopPropagation();
                        saveProjectRename(project.projectId);
                      }}
                      style={{
                        ...buttonStyle,
                        background: 'rgba(34, 197, 94, 0.16)',
                        border: '1px solid rgba(34, 197, 94, 0.34)',
                        color: '#dcfce7',
                      }}
                    >
                      Save name
                    </button>
                    <button
                      type="button"
                      data-home-project-workspace-rename-cancel={project.projectId}
                      onClick={(event) => {
                        event.stopPropagation();
                        setRenamingProjectId('');
                        setRenameValue('');
                      }}
                      style={{
                        ...buttonStyle,
                        background: 'rgba(15, 23, 42, 0.46)',
                        border: '1px solid rgba(148, 163, 184, 0.18)',
                        color: '#cbd5e1',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <button
                    type="button"
                    data-home-project-workspace-load={project.projectId}
                    onClick={(event) => {
                      event.stopPropagation();
                      loadProject(project);
                    }}
                    style={{
                      ...buttonStyle,
                      background: 'rgba(34, 197, 94, 0.14)',
                      border: '1px solid rgba(34, 197, 94, 0.34)',
                      color: '#dcfce7',
                    }}
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    data-home-project-workspace-rename={project.projectId}
                    onClick={(event) => {
                      event.stopPropagation();
                      beginRenameProject(project);
                    }}
                    style={{
                      ...buttonStyle,
                      background: 'rgba(251, 191, 36, 0.12)',
                      border: '1px solid rgba(251, 191, 36, 0.28)',
                      color: '#fef3c7',
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    data-home-project-workspace-duplicate={project.projectId}
                    onClick={(event) => {
                      event.stopPropagation();
                      duplicateProject(project.projectId);
                    }}
                    style={{
                      ...buttonStyle,
                      background: 'rgba(14, 165, 233, 0.12)',
                      border: '1px solid rgba(125, 211, 252, 0.28)',
                      color: '#e0f2fe',
                    }}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    data-home-project-workspace-delete={project.projectId}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeProject(project.projectId);
                    }}
                    style={{
                      ...buttonStyle,
                      background: 'rgba(127, 29, 29, 0.18)',
                      border: '1px solid rgba(248, 113, 113, 0.3)',
                      color: '#fecaca',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div
        data-home-project-workspace-disclaimer="true"
        style={{
          borderTop: '1px solid rgba(34, 197, 94, 0.18)',
          color: '#86efac',
          fontSize: isTouchDevice ? '0.54rem' : '0.58rem',
          fontWeight: 800,
          lineHeight: 1.28,
          marginTop: isTouchDevice ? '9px' : '10px',
          paddingTop: isTouchDevice ? '8px' : '9px',
        }}
      >
        Local preview workspace only. Projects are stored in this browser and are not submitted to a backend.
      </div>
    </section>
  );
}
