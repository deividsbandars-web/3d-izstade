import type { ReactNode } from 'react';
import type { ExpoScreenInventorySlot } from '../../../shared/expo/screenInventory';
import { validateExpoScreenMediaUrl } from '../../../shared/expo/screenContentMedia';
import {
  getExpoMediaReviewUploadAccept,
  type ExpoMediaReviewUploadKind,
} from '../../../shared/expo/mediaReviewUpload';
import type { ExpoSponsorPackageTier } from '../../../shared/expo/sponsorAssetPack';
import {
  getCityScreenAvailabilityLabel,
  getCityScreenBuyerSteps,
  getCityScreenLocationLabel,
  getCityScreenPlacementLabel,
} from '../../../app/expo/cityScreenRental';
import {
  getExpoCityScreenCampaignStatusLabel,
  normalizeExpoCityScreenCampaign,
  type ExpoCityScreenCampaignStatus,
} from '../../../shared/expo/cityScreenCampaign';
import './CompanyAdminQuickSetup.css';

export type CompanyAdminWorkspaceMode = 'advanced' | 'booth' | 'city-screen';

export type QuickScreenContent = {
  campaignEndDate: string;
  campaignStartDate: string;
  campaignStatus: ExpoCityScreenCampaignStatus;
  ctaLabel: string;
  imageUrl: string;
  mode: 'generated-card' | 'image' | 'video' | 'video-placeholder';
  screenSlotId: string;
  status: 'draft' | 'published';
  subtitle: string;
  title: string;
  videoUrl: string;
};

const modeLabels: Record<QuickScreenContent['mode'], string> = {
  'generated-card': 'Text card',
  image: 'Image',
  video: 'Video',
  'video-placeholder': 'Video poster',
};

function actionButtonStyle(active = false) {
  return {
    background: active ? 'rgba(14, 116, 144, 0.32)' : 'rgba(15, 23, 42, 0.72)',
    border: `1px solid ${active ? 'rgba(103, 232, 249, 0.72)' : 'rgba(148, 163, 184, 0.22)'}`,
    borderRadius: '8px',
    color: active ? '#ecfeff' : '#cbd5e1',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 850,
    minHeight: '42px',
    padding: '9px 13px',
  } as const;
}

function StepHeading({ number, title }: { number: number; title: string }) {
  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: '10px', marginBottom: '14px' }}>
      <span
        style={{
          alignItems: 'center',
          background: '#0e7490',
          borderRadius: '50%',
          color: '#ecfeff',
          display: 'inline-flex',
          fontSize: '0.78rem',
          fontWeight: 950,
          height: '28px',
          justifyContent: 'center',
          width: '28px',
        }}
      >
        {number}
      </span>
      <h2 style={{ color: '#f8fafc', fontSize: '1.05rem', margin: 0 }}>{title}</h2>
    </div>
  );
}

function ReviewUploadInput({
  disabled,
  disabledHint,
  helperText,
  kind,
  label,
  onUpload,
  status,
  uploading,
}: {
  disabled: boolean;
  disabledHint?: string;
  helperText?: string;
  kind: ExpoMediaReviewUploadKind;
  label: string;
  onUpload: (files: FileList | null) => void;
  status: string;
  uploading: boolean;
}) {
  return (
    <div>
      <label
        style={{
          alignItems: 'center',
          background: disabled ? 'rgba(30, 41, 59, 0.48)' : 'rgba(14, 116, 144, 0.24)',
          border: '1px solid rgba(103, 232, 249, 0.42)',
          borderRadius: '8px',
          color: disabled ? '#64748b' : '#ecfeff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          fontSize: '0.82rem',
          fontWeight: 900,
          minHeight: '44px',
          padding: '10px 14px',
        }}
      >
        {uploading ? 'Uploading...' : label}
        <input
          type="file"
          accept={getExpoMediaReviewUploadAccept(kind)}
          disabled={disabled}
          onChange={(event) => {
            onUpload(event.currentTarget.files);
            event.currentTarget.value = '';
          }}
          style={{ display: 'none' }}
        />
      </label>
      <div style={{ color: status.toLowerCase().includes('failed') ? '#fca5a5' : '#94a3b8', fontSize: '0.72rem', lineHeight: 1.45, marginTop: '7px' }}>
        {status || (disabled
          ? (disabledHint || 'Save the draft first, then upload the file.')
          : (helperText || 'JPG, PNG, WEBP or MP4. The file stays private until the Warpala team approves it.'))}
      </div>
    </div>
  );
}

function SetupScopeBanner({
  actions,
  body,
  pills,
  title,
}: {
  actions?: ReactNode;
  body: string;
  pills: string[];
  title: string;
}) {
  return (
    <div className="company-admin-scope-banner">
      <div>
        <div className="company-admin-scope-title">{title}</div>
        <p>{body}</p>
        <div className="company-admin-scope-pills">
          {pills.map((pill) => (
            <span key={pill}>{pill}</span>
          ))}
        </div>
      </div>
      {actions && <div className="company-admin-scope-actions">{actions}</div>}
    </div>
  );
}

function CityScreenSelectedSummary({ slot }: { slot: ExpoScreenInventorySlot | null }) {
  if (!slot) {
    return (
      <div className="company-admin-selected-screen is-empty">
        <div>
          <span>Start here</span>
          <strong>Choose one city screen before adding media.</strong>
        </div>
        <p>The selected city screen is the exact public advertising surface your request will use.</p>
      </div>
    );
  }

  return (
    <div className="company-admin-selected-screen">
      <div>
        <span>Selected city screen</span>
        <strong>{slot.label}</strong>
      </div>
      <dl>
        <div>
          <dt>Location</dt>
          <dd>{getCityScreenLocationLabel(slot)}</dd>
        </div>
        <div>
          <dt>Placement</dt>
          <dd>{getCityScreenPlacementLabel(slot)}</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>EUR {slot.monthlyPriceHintEur}/month</dd>
        </div>
      </dl>
      <p>{slot.placementNotes}</p>
    </div>
  );
}

function ScreenPreview({
  companyName,
  content,
  surfaceLabel,
  slot,
}: {
  companyName: string;
  content: QuickScreenContent;
  surfaceLabel?: string;
  slot: ExpoScreenInventorySlot | null;
}) {
  const image = validateExpoScreenMediaUrl(content.imageUrl, 'image');
  const video = validateExpoScreenMediaUrl(content.videoUrl, 'video');
  const accent = slot?.valueTier === 'landmark'
    ? '#facc15'
    : slot?.valueTier === 'hero'
      ? '#7dd3fc'
      : '#5eead4';

  return (
    <div
      style={{
        aspectRatio: '16 / 9',
        background: '#07111d',
        border: `3px solid ${accent}`,
        borderRadius: '6px',
        display: 'grid',
        overflow: 'hidden',
        placeItems: 'stretch',
        position: 'relative',
      }}
    >
      {content.mode === 'image' && image.ok && image.url ? (
        <img
          alt=""
          src={image.url}
          style={{ height: '100%', objectFit: 'cover', width: '100%' }}
        />
      ) : content.mode === 'video' && video.ok && video.url ? (
        <video
          controls
          muted
          playsInline
          poster={image.ok ? image.url : undefined}
          preload="metadata"
          src={video.url}
          style={{ background: '#020617', height: '100%', objectFit: 'cover', width: '100%' }}
        />
      ) : (
        <div
          style={{
            alignContent: 'center',
            background: 'linear-gradient(135deg, #07111d, #123047)',
            display: 'grid',
            padding: '24px',
          }}
        >
          <div style={{ color: accent, fontSize: '0.68rem', fontWeight: 950, textTransform: 'uppercase' }}>
            {slot?.label || surfaceLabel || 'Screen preview'}
          </div>
          <div style={{ color: '#ffffff', fontSize: '1.35rem', fontWeight: 950, marginTop: '8px' }}>
            {content.title.trim() || companyName.trim() || 'Your campaign'}
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.4, marginTop: '8px' }}>
            {content.subtitle.trim() || 'Add one short message visitors can understand while walking.'}
          </div>
          <div style={{ color: '#ffffff', fontSize: '0.72rem', fontWeight: 900, marginTop: '14px', textTransform: 'uppercase' }}>
            {content.ctaLabel.trim() || 'Learn more'}
          </div>
        </div>
      )}
    </div>
  );
}

export function CompanyAdminWorkspaceTabs({
  mode,
  onChange,
}: {
  mode: CompanyAdminWorkspaceMode;
  onChange: (mode: CompanyAdminWorkspaceMode) => void;
}) {
  const options: Array<{ description: string; label: string; value: CompanyAdminWorkspaceMode }> = [
    { description: 'Rent and configure a specific advertising screen in the city.', label: 'City advertising', value: 'city-screen' },
    { description: 'Set up the sponsor booth profile and its own screen.', label: 'Booth setup', value: 'booth' },
    { description: 'Publishing, analytics, leads and team controls.', label: 'Full setup', value: 'advanced' },
  ];

  return (
    <section style={{ marginBottom: '24px' }}>
      <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        {options.map((option) => {
          const active = option.value === mode;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              style={{
                ...actionButtonStyle(active),
                minHeight: '78px',
                padding: '13px 15px',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'block', fontSize: '0.9rem' }}>{option.label}</span>
              <span style={{ color: active ? '#bae6fd' : '#94a3b8', display: 'block', fontSize: '0.72rem', fontWeight: 600, lineHeight: 1.4, marginTop: '5px' }}>
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CityScreenQuickSetup({
  canUpload,
  canSave,
  canSubmit,
  companyName,
  content,
  isOperatorAdmin,
  loading,
  onChange,
  onApprove,
  onOpenBoothSetup,
  onOpenCatalog,
  onOpenCity,
  onPublish,
  onRequestChanges,
  onSaveDraft,
  onChangeCompanyName,
  onSelectSlot,
  onSubmitReview,
  onUploadMedia,
  selectedSlot,
  slots,
  uploadStatus,
  uploading,
  validationIssue,
}: {
  canUpload: boolean;
  canSave: boolean;
  canSubmit: boolean;
  companyName: string;
  content: QuickScreenContent;
  isOperatorAdmin: boolean;
  loading: boolean;
  onChange: (patch: Partial<QuickScreenContent>) => void;
  onApprove: () => void;
  onOpenBoothSetup: () => void;
  onOpenCatalog: () => void;
  onOpenCity: () => void;
  onPublish: () => void;
  onRequestChanges: () => void;
  onSaveDraft: () => void;
  onChangeCompanyName: (name: string) => void;
  onSelectSlot: (slotId: string) => void;
  onSubmitReview: () => void;
  onUploadMedia: (files: FileList | null) => void;
  selectedSlot: ExpoScreenInventorySlot | null;
  slots: ExpoScreenInventorySlot[];
  uploadStatus: string;
  uploading: boolean;
  validationIssue: string;
}) {
  const activeMode = content.mode === 'video-placeholder' ? 'video' : content.mode;
  const buyerSteps = getCityScreenBuyerSteps();
  const campaignSummary = normalizeExpoCityScreenCampaign(content);
  const statusLabel = getExpoCityScreenCampaignStatusLabel(content.campaignStatus);

  return (
    <section className="calc-section company-admin-quick-setup" style={{ marginBottom: '28px' }}>
      <div style={{ alignItems: 'start', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#67e8f9', fontSize: '0.72rem', fontWeight: 950, textTransform: 'uppercase' }}>City advertising</div>
          <h1 style={{ color: '#f8fafc', fontSize: '1.7rem', margin: '7px 0 6px' }}>Choose the exact screen visitors will see</h1>
          <p style={{ color: '#94a3b8', lineHeight: 1.55, margin: 0, maxWidth: '720px' }}>
            This setup changes a city advertising screen. It does not change the screen inside your booth.
          </p>
        </div>
        <div style={{ alignItems: 'flex-end', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span className={`company-admin-campaign-status status-${content.campaignStatus}`}>{statusLabel}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-glass" onClick={onOpenCity}>View city</button>
            <button type="button" className="btn-glass" onClick={onOpenCatalog}>Browse screens</button>
          </div>
        </div>
      </div>

      <SetupScopeBanner
        actions={<button type="button" className="btn-glass" onClick={onOpenBoothSetup}>Set up booth instead</button>}
        body="Use this when you want an advertisement on a public screen in the shared city. Booth screens are edited in Booth setup."
        pills={[
          selectedSlot ? selectedSlot.label : 'No city screen selected',
          'City advertising only',
          'Review before it goes live',
        ]}
        title="You are editing a rented city screen"
      />

      <div className="company-admin-help-grid" aria-label="City screen setup steps">
        {buyerSteps.map((step) => (
          <div key={step.number}>
            <span>STEP {step.number}</span>
            <strong>{step.title}</strong>
            <p>{step.body}</p>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.18)', marginTop: '22px', paddingTop: '22px' }}>
        <StepHeading number={1} title="Choose a city screen" />
        <CityScreenSelectedSummary slot={selectedSlot} />
        <div style={{ display: 'grid', gap: '8px' }}>
          {slots.map((slot) => {
            const active = selectedSlot?.id === slot.id;
            const unavailable = slot.status !== 'available' && !active;
            return (
              <button
                key={slot.id}
                type="button"
                aria-pressed={active}
                className="company-admin-city-slot-choice"
                disabled={unavailable}
                onClick={() => onSelectSlot(slot.id)}
                style={{
                  background: active ? 'rgba(14, 116, 144, 0.22)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(103, 232, 249, 0.62)' : 'rgba(148, 163, 184, 0.16)'}`,
                  color: '#f8fafc',
                  cursor: unavailable ? 'not-allowed' : 'pointer',
                  opacity: unavailable ? 0.5 : 1,
                }}
              >
                <span>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>{slot.label}</strong>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.74rem', lineHeight: 1.4, marginTop: '4px' }}>
                    {getCityScreenLocationLabel(slot)} / {slot.sizeLabel} / {getCityScreenPlacementLabel(slot)}
                  </span>
                </span>
                <span style={{ display: 'grid', gap: '4px', justifyItems: 'end', textAlign: 'right' }}>
                  <span style={{ color: active ? '#a5f3fc' : '#cbd5e1', fontSize: '0.72rem', fontWeight: 950, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {active ? 'Selected' : getCityScreenAvailabilityLabel(slot)}
                  </span>
                  <span style={{ color: '#f8fafc', fontSize: '0.76rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
                    EUR {slot.monthlyPriceHintEur}/month
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.18)', marginTop: '22px', paddingTop: '22px' }}>
        <StepHeading number={2} title="Choose dates and add the advertisement" />
        <div className="company-admin-campaign-schedule">
          <label>
            Starts
            <input
              type="date"
              value={content.campaignStartDate}
              onChange={(event) => onChange({ campaignStartDate: event.target.value })}
            />
          </label>
          <label>
            Ends
            <input
              type="date"
              min={content.campaignStartDate || undefined}
              value={content.campaignEndDate}
              onChange={(event) => onChange({ campaignEndDate: event.target.value })}
            />
          </label>
          <div className="company-admin-campaign-estimate">
            <span>Estimated booking</span>
            <strong>
              {campaignSummary.durationDays > 0
                ? `${campaignSummary.durationDays} days / EUR ${campaignSummary.estimatedPriceEur}`
                : 'Choose both dates'}
            </strong>
            <small>
              {campaignSummary.billingMonths > 0
                ? `${campaignSummary.billingMonths} billing month${campaignSummary.billingMonths === 1 ? '' : 's'}`
                : 'Monthly rate shown above'}
            </small>
          </div>
        </div>
        <div style={{ background: 'rgba(8, 47, 73, 0.28)', border: '1px solid rgba(103, 232, 249, 0.2)', borderRadius: '8px', marginBottom: '18px', padding: '14px' }}>
          <div style={{ color: '#f8fafc', fontSize: '0.88rem', fontWeight: 900, marginBottom: '9px' }}>
            Upload the city screen ad
          </div>
          <ReviewUploadInput
            disabled={!canUpload}
            disabledHint="Save the draft once to unlock private uploads. You can still paste a direct image or video link below."
            helperText="Use JPG, PNG, WEBP, MP4 or WEBM. Warpala reviews the media before it goes live."
            kind="city-screen"
            label="Upload city ad image or video"
            onUpload={onUploadMedia}
            status={uploadStatus}
            uploading={uploading}
          />
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 800, marginBottom: '9px', textTransform: 'uppercase' }}>
          What visitors will see
        </div>
        <div className="company-admin-screen-distinction">
          <strong>City screen, not booth screen</strong>
          <span>These fields update the selected public city screen only. Booth logo, booth image and booth screen media stay in Booth setup.</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {(['generated-card', 'image', 'video'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ mode })}
              style={actionButtonStyle(activeMode === mode)}
            >
              {modeLabels[mode]}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <div>
            <label>
              Sponsor name
              <input
                type="text"
                placeholder="Company or campaign owner"
                value={companyName}
                onChange={(event) => onChangeCompanyName(event.target.value)}
              />
            </label>
            <label style={{ marginTop: '14px' }}>
              Screen headline
              <input
                type="text"
                placeholder="One clear campaign headline"
                value={content.title}
                onChange={(event) => onChange({ title: event.target.value })}
              />
            </label>
            <label style={{ marginTop: '14px' }}>
              Short message
              <textarea
                placeholder="Explain the offer in one short sentence."
                value={content.subtitle}
                onChange={(event) => onChange({ subtitle: event.target.value })}
                style={{ height: '86px' }}
              />
            </label>
            <label style={{ marginTop: '14px' }}>
              Button text
              <input
                type="text"
                placeholder="Request demo"
                value={content.ctaLabel}
                onChange={(event) => onChange({ ctaLabel: event.target.value })}
              />
            </label>
            {activeMode === 'image' && (
              <label style={{ marginTop: '14px' }}>
                Campaign image link
                <input
                  type="url"
                  inputMode="url"
                  placeholder="https://your-site.com/campaign.webp"
                  value={content.imageUrl}
                  onChange={(event) => onChange({ imageUrl: event.target.value })}
                />
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem', lineHeight: 1.4, marginTop: '6px' }}>
                  Use a direct image file link, or upload the image above.
                </span>
              </label>
            )}
            {activeMode === 'video' && (
              <>
                <label style={{ marginTop: '14px' }}>
                  Campaign video link
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://your-site.com/campaign.mp4"
                    value={content.videoUrl}
                    onChange={(event) => onChange({ videoUrl: event.target.value })}
                  />
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem', lineHeight: 1.4, marginTop: '6px' }}>
                    Use a direct MP4 or WEBM file link. Large videos are reviewed before they go live.
                  </span>
                </label>
                <label style={{ marginTop: '14px' }}>
                  Poster image URL
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://your-site.com/video-poster.webp"
                    value={content.imageUrl}
                    onChange={(event) => onChange({ imageUrl: event.target.value })}
                  />
                </label>
              </>
            )}
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 900, marginBottom: '8px', textTransform: 'uppercase' }}>
              Screen preview
            </div>
            <ScreenPreview companyName={companyName} content={content} slot={selectedSlot} />
            <div style={{ color: validationIssue ? '#fca5a5' : '#86efac', fontSize: '0.74rem', lineHeight: 1.45, marginTop: '10px' }}>
              {validationIssue || (selectedSlot ? `${selectedSlot.label} is ready to save.` : 'Choose a city screen to continue.')}
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.18)', marginTop: '22px', paddingTop: '22px' }}>
        <StepHeading number={3} title="Save or submit" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button type="button" className="btn-glass" disabled={!canSave || loading} onClick={onSaveDraft}>
            {loading ? 'Saving...' : 'Save draft'}
          </button>
          <button type="button" className="btn-primary" disabled={!canSubmit || loading} onClick={onSubmitReview}>
            Submit screen request
          </button>
          {isOperatorAdmin && (
            <>
              <button type="button" className="btn-glass" disabled={!canSubmit || loading || content.campaignStatus === 'approved' || content.campaignStatus === 'live'} onClick={onApprove}>
                Approve request
              </button>
              <button type="button" className="btn-glass" disabled={!canSubmit || loading || content.campaignStatus !== 'submitted'} onClick={onRequestChanges}>
                Request changes
              </button>
              <button type="button" className="btn-primary" disabled={!canSubmit || loading || content.campaignStatus !== 'approved'} onClick={onPublish}>
                Publish approved campaign
              </button>
            </>
          )}
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.5, margin: '12px 0 0' }}>
          Save keeps the request private. Submit sends this exact city screen, dates and media for review. After approval, Warpala publishes it on the selected city screen. Booth content remains separate.
        </p>
      </div>
    </section>
  );
}

export function BoothQuickSetup({
  boothMediaUploadStatus,
  canUpload,
  canOpenPreview,
  canSave,
  ctaPrimary,
  companyName,
  content,
  headline,
  heroImageUrl,
  loading,
  logoUploadStatus,
  logoUrl,
  onChangeAssetPack,
  onChangeCompanyName,
  onChangeScreen,
  onOpenCityAdvertising,
  onOpenPreview,
  onSave,
  onSubmitReview,
  onUploadBoothMedia,
  onUploadLogo,
  packageTier,
  shortPitch,
  validationIssue,
  websiteUrl,
  uploadingBoothMedia,
  uploadingLogo,
}: {
  boothMediaUploadStatus: string;
  canUpload: boolean;
  canOpenPreview: boolean;
  canSave: boolean;
  ctaPrimary: string;
  companyName: string;
  content: QuickScreenContent;
  headline: string;
  heroImageUrl: string;
  loading: boolean;
  logoUploadStatus: string;
  logoUrl: string;
  onChangeAssetPack: (patch: {
    ctaPrimary?: string;
    headline?: string;
    heroImageUrl?: string;
    logoUrl?: string;
    packageTier?: ExpoSponsorPackageTier;
    shortPitch?: string;
    websiteUrl?: string;
  }) => void;
  onChangeCompanyName: (name: string) => void;
  onChangeScreen: (patch: Partial<QuickScreenContent>) => void;
  onOpenCityAdvertising: () => void;
  onOpenPreview: () => void;
  onSave: () => void;
  onSubmitReview: () => void;
  onUploadBoothMedia: (files: FileList | null) => void;
  onUploadLogo: (files: FileList | null) => void;
  packageTier: ExpoSponsorPackageTier;
  shortPitch: string;
  validationIssue: string;
  websiteUrl: string;
  uploadingBoothMedia: boolean;
  uploadingLogo: boolean;
}) {
  const activeMode = content.mode === 'video-placeholder' ? 'video' : content.mode;

  return (
    <section className="calc-section company-admin-quick-setup" style={{ marginBottom: '28px' }}>
      <div>
        <div style={{ color: '#67e8f9', fontSize: '0.72rem', fontWeight: 950, textTransform: 'uppercase' }}>Booth setup</div>
        <h1 style={{ color: '#f8fafc', fontSize: '1.7rem', margin: '7px 0 6px' }}>Set up the sponsor booth in three steps</h1>
        <p style={{ color: '#94a3b8', lineHeight: 1.55, margin: 0, maxWidth: '720px' }}>
          Add the sponsor message and booth media here. City advertising screens are configured in the separate City advertising tab.
        </p>
      </div>

      <SetupScopeBanner
        actions={<button type="button" className="btn-glass" onClick={onOpenCityAdvertising}>Rent city screen instead</button>}
        body="Use this for the sponsor booth visitors can walk up to. The booth screen is the media surface inside the booth."
        pills={[
          'Sponsor booth',
          'Booth screen only',
          'City screens stay separate',
        ]}
        title="You are editing the booth"
      />

      <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.18)', marginTop: '22px', paddingTop: '22px' }}>
        <StepHeading number={1} title="Sponsor details" />
        <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
          <label>
            Sponsor name
            <input type="text" value={companyName} onChange={(event) => onChangeCompanyName(event.target.value)} />
          </label>
          <label>
            Booth package
            <select value={packageTier} onChange={(event) => onChangeAssetPack({ packageTier: event.target.value as ExpoSponsorPackageTier })}>
              <option value="standard">Standard booth</option>
              <option value="premium">Featured booth</option>
              <option value="landmarkZone">Landmark sponsor</option>
            </select>
          </label>
          <label>
            Main headline
            <input type="text" placeholder="What does the sponsor offer?" value={headline} onChange={(event) => onChangeAssetPack({ headline: event.target.value })} />
          </label>
          <label>
            Website
            <input type="url" inputMode="url" placeholder="https://example.com" value={websiteUrl} onChange={(event) => onChangeAssetPack({ websiteUrl: event.target.value })} />
          </label>
          <label>
            Button text
            <input type="text" placeholder="Request demo" value={ctaPrimary} onChange={(event) => onChangeAssetPack({ ctaPrimary: event.target.value })} />
          </label>
        </div>
        <label style={{ marginTop: '14px' }}>
          Short offer
          <textarea
            placeholder="One or two sentences visitors can understand immediately."
            value={shortPitch}
            onChange={(event) => onChangeAssetPack({ shortPitch: event.target.value })}
            style={{ height: '86px' }}
          />
        </label>
      </div>

      <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.18)', marginTop: '22px', paddingTop: '22px' }}>
        <StepHeading number={2} title="Logo and booth screen media" />
        <div className="company-admin-screen-distinction">
          <strong>Booth screen, not city advertising</strong>
          <span>This media appears inside the sponsor booth preview. Public city screens are rented and submitted from City advertising.</span>
        </div>
        <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', marginBottom: '16px' }}>
          <ReviewUploadInput
            disabled={!canUpload}
            disabledHint="Save the booth once to unlock private logo uploads. You can still paste a logo URL below."
            helperText="Use a clean logo file. It stays private until the sponsor booth is approved."
            kind="logo"
            label="Upload sponsor logo"
            onUpload={onUploadLogo}
            status={logoUploadStatus}
            uploading={uploadingLogo}
          />
          <ReviewUploadInput
            disabled={!canUpload}
            disabledHint="Save the booth once to unlock private booth screen uploads. You can still paste a direct media link below."
            helperText="Use an image or short video for the screen inside the booth. This does not buy a public city screen."
            kind="booth-screen"
            label="Upload booth screen image or video"
            onUpload={onUploadBoothMedia}
            status={boothMediaUploadStatus}
            uploading={uploadingBoothMedia}
          />
        </div>
        <div style={{ display: 'grid', gap: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
          <label>
            Logo URL (optional)
            <input type="url" inputMode="url" placeholder="https://cdn.example.com/logo.png" value={logoUrl} onChange={(event) => onChangeAssetPack({ logoUrl: event.target.value })} />
          </label>
          <label>
            Main image URL (optional)
            <input type="url" inputMode="url" placeholder="https://cdn.example.com/hero.webp" value={heroImageUrl} onChange={(event) => onChangeAssetPack({ heroImageUrl: event.target.value })} />
          </label>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '16px 0' }}>
          {(['generated-card', 'image', 'video'] as const).map((mode) => (
            <button key={mode} type="button" onClick={() => onChangeScreen({ mode })} style={actionButtonStyle(activeMode === mode)}>
              {modeLabels[mode]}
            </button>
          ))}
        </div>
        {activeMode === 'image' && (
          <label>
            Booth screen image URL
            <input type="url" inputMode="url" placeholder="https://cdn.example.com/booth-screen.webp" value={content.imageUrl} onChange={(event) => onChangeScreen({ imageUrl: event.target.value })} />
          </label>
        )}
        {activeMode === 'video' && (
          <label>
            Booth screen video URL
            <input type="url" inputMode="url" placeholder="https://cdn.example.com/booth-screen.mp4" value={content.videoUrl} onChange={(event) => onChangeScreen({ videoUrl: event.target.value })} />
          </label>
        )}
        <div style={{ marginTop: '14px' }}>
          <ScreenPreview companyName={companyName} content={content} slot={null} surfaceLabel="Booth screen" />
        </div>
        <div style={{ color: validationIssue ? '#fca5a5' : '#86efac', fontSize: '0.74rem', lineHeight: 1.45, marginTop: '10px' }}>
          {validationIssue || 'Booth preview content is ready to save.'}
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.18)', marginTop: '22px', paddingTop: '22px' }}>
        <StepHeading number={3} title="Save and preview" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button type="button" className="btn-glass" disabled={!canSave || loading} onClick={onSave}>
            {loading ? 'Saving...' : 'Save booth'}
          </button>
          <button type="button" className="btn-primary" disabled={!canSave || loading} onClick={onSubmitReview}>
            Submit booth for review
          </button>
          <button type="button" className="btn-glass" disabled={!canOpenPreview} onClick={onOpenPreview}>
            Open booth preview
          </button>
        </div>
      </div>
    </section>
  );
}
