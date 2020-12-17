/********************************************************************************
 * Copyright (C) 2017-2020 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import "../../css/decoration.css";
import "../../css/diagram.css";
import "../../css/theia-dialogs.css";
import "../../css/tool-palette.css";

import { BinalyzerSymbolInformationNode, BinalyzerViewService } from "@binalyzer/binalyzer-view/lib/browser";
import {
    ApplicationIdProvider,
    BLSPClient,
    ClientState,
    ConnectionProvider,
    InitializeParameters
} from "@eclipse-blsp/protocol";
import {
    CommandContribution,
    CommandRegistry,
    Disposable,
    DisposableCollection,
    MaybePromise,
    MessageService
} from "@theia/core";
import { FrontendApplication, WebSocketConnectionProvider } from "@theia/core/lib/browser";
import { Deferred } from "@theia/core/lib/common/promise-util";
import URI from "@theia/core/lib/common/uri";
import { FileSystem } from "@theia/filesystem/lib/common";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { inject, injectable } from "inversify";
import { MessageConnection } from "vscode-jsonrpc";

import { BLSPContribution } from "../common";
import { TheiaJsonrpcBLSPClient } from "./theia-jsonrpc-blsp-client";

export const BLSPClientContribution = Symbol.for('BLSPClientContribution');

@injectable()
export class BinalyzerCommandContribution implements CommandContribution {
    @inject(FileSystem) protected readonly fileSystem: FileSystem;
    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;
    @inject(MessageService) protected readonly messageService: MessageService;
    @inject(BinalyzerViewService) protected readonly viewService: BinalyzerViewService;
    @inject(BLSPClientContribution) readonly blspClientContribution: BLSPClientContribution;

    constructor() {

    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(
            {
                id: 'binalyzer-send-debug-message',
                label: 'Binalyzer: Send LSP test message'
            },
            {
                execute: (args) => {
                    const blspClient = this.blspClientContribution.bslpClient;
                    blspClient.then((client: BLSPClient) => {
                        if (this.workspaceService.workspace) {
                            const uri = new URI(this.workspaceService.workspace.uri + '/binalyzer.json');
                            this.fileSystem.resolveContent(uri.toString()).then(file => {
                                const obj = JSON.parse(file.content);
                                const binding_name = obj.name;
                                const data_filepath = obj.data;
                                const template_filepath = obj.template;
                                client.sendBindingMessage({
                                    template: template_filepath,
                                    data: data_filepath
                                }).then((binding: any) => {
                                    const binding_root = JSON.parse(binding) as BinalyzerSymbolInformationNode;
                                    const diagram = {
                                        id: 'diagram',
                                        name: 'Diagram',
                                        description: template_filepath,
                                        visible: true,
                                        parent: undefined,
                                        children: [],
                                        busy: 0,
                                        iconClass: '',
                                        selected: false,
                                        expanded: false,
                                    } as BinalyzerSymbolInformationNode;

                                    const root_children = [];
                                    root_children.push(diagram);

                                    for (let i = 0; i < binding_root.children.length; i++) {
                                        root_children.push(binding_root.children[i]);
                                    }

                                    const root = {
                                        id: binding_root.id,
                                        name: binding_name,
                                        description: binding_root.name,
                                        visible: true,
                                        parent: undefined,
                                        children: root_children,
                                        busy: 0,
                                        iconClass: '',
                                        selected: false,
                                        expanded: false
                                    } as BinalyzerSymbolInformationNode;

                                    this.viewService.publish([root]);
                                });
                            });
                        }
                    });
                }
            }
        );
    }
}

export interface BLSPClientContribution extends BLSPContribution {
    readonly running: boolean;
    readonly bslpClient: Promise<BLSPClient>;
    waitForActivation(app: FrontendApplication): Promise<void>;
    activate(app: FrontendApplication): Disposable;
    deactivate(app: FrontendApplication): void;
}
@injectable()
export abstract class BaseBLSPClientContribution implements BLSPClientContribution {

    abstract readonly id: string;
    abstract readonly name: string;
    abstract readonly fileExtensions: string[];

    protected _bslpClient: BLSPClient | undefined;

    protected resolveReady: (bslpClient: BLSPClient) => void;
    protected ready: Promise<BLSPClient>;
    protected deferredConnection = new Deferred<MessageConnection>();
    protected readonly toDeactivate = new DisposableCollection();

    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;
    @inject(MessageService) protected readonly messageService: MessageService;
    @inject(WebSocketConnectionProvider) protected readonly connectionProvider: WebSocketConnectionProvider;
    @inject(CommandRegistry) protected readonly commands: CommandRegistry;

    constructor() {
        this.waitForReady();
    }

    get bslpClient(): Promise<BLSPClient> {
        return this._bslpClient ? Promise.resolve(this._bslpClient) : this.ready;
    }

    waitForActivation(app: FrontendApplication): Promise<any> {
        const activationPromises: Promise<any>[] = [];
        const workspaceContains = this.workspaceContains;
        if (workspaceContains.length !== 0) {
            activationPromises.push(this.waitForItemInWorkspace());
        }
        return this.ready;
    }

    activate(): Disposable {
        if (this.toDeactivate.disposed) {
            if (!this._bslpClient) {
                this._bslpClient = this.createBLSPCLient(() => this.deferredConnection.promise);
            }
            const toStop = new DisposableCollection(Disposable.create(() => { })); // mark as not disposed
            this.toDeactivate.push(toStop);
            this.doActivate(this.toDeactivate).then(() => {
                this.initialize();
            });
        }

        return this.toDeactivate;
    }

    deactivate(_app: FrontendApplication): void {
        this.toDeactivate.dispose();
    }

    protected async createInitializeParameters(): Promise<InitializeParameters> {
        const options = await this.createInitializeOptions();
        return {
            applicationId: ApplicationIdProvider.get(),
            options
        };
    }

    protected createInitializeOptions(): MaybePromise<any> {
        return undefined;
    }

    async initialize(): Promise<void> {
        const parameters = await this.createInitializeParameters();
        this.ready.then(client => client.initializeServer(parameters)
            .then(success => {
                if (!success) {
                    this.messageService.error(`Failed to initialize ${this.name} bslp server with ${JSON.stringify(parameters)}`, 'Retry')
                        .then(retry => {
                            if (retry) {
                                this.initialize();
                            }
                        });
                } else {
                    this.commands.executeCommand('binalyzer-send-debug-message');
                }
            })
        );
    }

    protected async doActivate(toStop: DisposableCollection): Promise<void> {
        try {
            this.connectionProvider.listen({
                path: BLSPContribution.getPath(this),
                onConnection: messageConnection => {
                    this.deferredConnection.resolve(messageConnection);
                    messageConnection.onDispose(() => this.deferredConnection = new Deferred<MessageConnection>());

                    if (toStop.disposed) {
                        messageConnection.dispose();
                        return;
                    }
                    const languageClient = this.createBLSPCLient(messageConnection);
                    this.onWillStart(languageClient);
                    toStop.pushAll([
                        messageConnection,
                        Disposable.create(() => {
                            languageClient.shutdownServer();
                            languageClient.stop();
                        }
                        )
                    ]);
                }
            }, { reconnecting: false });
        } catch (e) {
            console.error(e);
        }
    }

    get running(): boolean {
        return !this.toDeactivate.disposed && this._bslpClient !== undefined
            && this._bslpClient.currentState() === ClientState.Running;
    }

    protected async onWillStart(languageClient: BLSPClient): Promise<void> {
        await languageClient.start();
        this.onReady(languageClient);
    }

    protected onReady(languageClient: BLSPClient): void {
        this._bslpClient = languageClient;
        this.resolveReady(this._bslpClient);
        this.waitForReady();
    }

    protected waitForReady(): void {
        this.ready = new Promise<BLSPClient>(resolve =>
            this.resolveReady = resolve
        );
    }

    protected createBLSPCLient(connectionProvider: ConnectionProvider): BLSPClient {
        return new TheiaJsonrpcBLSPClient({
            name: this.name,
            id: this.id,
            connectionProvider
        }, this.messageService);
    }


    protected get workspaceContains(): string[] {
        return [];
    }

    protected async waitForItemInWorkspace(): Promise<any> {
        const doesContain = await this.workspaceService.containsSome(this.workspaceContains);
        if (!doesContain) {
            return new Promise(resolve => { });
        }
        return doesContain;
    }
}
