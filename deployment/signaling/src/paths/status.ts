// Copyright Epic Games, Inc. All Rights Reserved.
import { SignallingServer } from '@epicgames-ps/lib-pixelstreamingsignalling-ue5.7';
import fs from 'fs';
import path from 'path';

type PackageJsonMetadata = {
    version?: string;
};

const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '..', '..', 'package.json'), { encoding: 'utf8' })
) as PackageJsonMetadata;

export default function (signallingServer: SignallingServer) {
    const operations = {
        GET
    };

    function GET(req: any, res: any, _next: any) {
        const nowTime = new Date();
        const uptime = nowTime.getTime() - signallingServer.startTime.getTime();
        res.status(200).json({
            uptime: uptime,
            streamer_count: signallingServer.streamerRegistry.count(),
            player_count: signallingServer.playerRegistry.count(),
            version: packageJson.version ?? '0.0.0'
        });
    }

    GET.apiDoc = {
        summary: 'Returns the current status of the server.',
        operationId: 'getConfig',
        responses: {
            200: {
                description: 'The current status of the server.',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                uptime: {
                                    type: 'number'
                                },
                                streamer_count: {
                                    type: 'number'
                                },
                                player_count: {
                                    type: 'number'
                                },
                                version: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    return operations;
}
