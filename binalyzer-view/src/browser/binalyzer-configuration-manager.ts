/********************************************************************************
 * Copyright (C) 2018 Red Hat, Inc. and others.
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
import { PreferenceService, StorageService } from "@theia/core/lib/browser";
import { ContextKey, ContextKeyService } from "@theia/core/lib/browser/context-key-service";
import { PreferenceConfigurations } from "@theia/core/lib/browser/preferences/preference-configurations";
import { Emitter, Event, WaitUntilEvent } from "@theia/core/lib/common/event";
import { QuickPickService } from "@theia/core/lib/common/quick-pick-service";
import URI from "@theia/core/lib/common/uri";
import { EditorManager, EditorWidget } from "@theia/editor/lib/browser";
import { FileSystem, FileSystemError } from "@theia/filesystem/lib/common";
import { MonacoEditor } from "@theia/monaco/lib/browser/monaco-editor";
import { WorkspaceService } from "@theia/workspace/lib/browser/workspace-service";
import { WorkspaceVariableContribution } from "@theia/workspace/lib/browser/workspace-variable-contribution";
import { inject, injectable, postConstruct } from "inversify";
import { visit } from "jsonc-parser";
import debounce = require("p-debounce");

import { BinalyzerConfiguration } from "../common/binalyzer-common";
import { BinalyzerService } from "../common/binalyzer-service";
import { BinalyzerConfigurationModel } from "./binalyzer-configuration-model";
import { BinalyzerSessionOptions } from "./binalyzer-session-options";

/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export interface WillProvideBinalyzerConfiguration extends WaitUntilEvent {
}

@injectable()
export class BinalyzerConfigurationManager {

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;
    @inject(BinalyzerService)
    protected readonly binalyzer: BinalyzerService;
    @inject(QuickPickService)
    protected readonly quickPick: QuickPickService;

    @inject(ContextKeyService)
    protected readonly contextKeyService: ContextKeyService;

    @inject(FileSystem)
    protected readonly filesystem: FileSystem;

    @inject(PreferenceService)
    protected readonly preferences: PreferenceService;

    @inject(PreferenceConfigurations)
    protected readonly preferenceConfigurations: PreferenceConfigurations;

    @inject(WorkspaceVariableContribution)
    protected readonly workspaceVariables: WorkspaceVariableContribution;

    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;

    protected readonly onWillProvideBinalyzerConfigurationEmitter = new Emitter<WillProvideBinalyzerConfiguration>();
    readonly onWillProvideBinalyzerConfiguration: Event<WillProvideBinalyzerConfiguration> = this.onWillProvideBinalyzerConfigurationEmitter.event;

    protected binalyzerConfigurationTypeKey: ContextKey<string>;

    protected initialized: Promise<void>;
    @postConstruct()
    protected async init(): Promise<void> {
        this.binalyzerConfigurationTypeKey = this.contextKeyService.createKey<string>('binalyzerConfigurationType', undefined);
        this.initialized = this.updateModels();
        this.preferences.onPreferenceChanged(e => {
            if (e.preferenceName === 'binalyzer') {
                this.updateModels();
            }
        });
    }

    protected readonly models = new Map<string, BinalyzerConfigurationModel>();
    protected updateModels = debounce(async () => {
        const roots = await this.workspaceService.roots;
        const toDelete = new Set(this.models.keys());
        for (const rootStat of roots) {
            const key = rootStat.uri;
            toDelete.delete(key);
            if (!this.models.has(key)) {
                const model = new BinalyzerConfigurationModel(key, this.preferences);
                model.onDidChange(() => this.updateCurrent());
                model.onDispose(() => this.models.delete(key));
                this.models.set(key, model);
            }
        }
        for (const uri of toDelete) {
            const model = this.models.get(uri);
            if (model) {
                model.dispose();
            }
        }
        this.updateCurrent();
    }, 500);

    get all(): IterableIterator<BinalyzerSessionOptions> {
        return this.getAll();
    }
    protected *getAll(): IterableIterator<BinalyzerSessionOptions> {
        for (const model of this.models.values()) {
            for (const configuration of model.configurations) {
                yield {
                    configuration,
                    workspaceFolderUri: model.workspaceFolderUri
                };
            }
        }
    }

    get supported(): Promise<IterableIterator<BinalyzerSessionOptions>> {
        return this.getSupported();
    }
    protected async getSupported(): Promise<IterableIterator<BinalyzerSessionOptions>> {
        await this.initialized;
        const binalyzerTypes = await this.binalyzer.binalyzerTypes();
        return this.doGetSupported(new Set(binalyzerTypes));
    }
    protected *doGetSupported(binalyzerTypes: Set<string>): IterableIterator<BinalyzerSessionOptions> {
        for (const options of this.getAll()) {
            if (binalyzerTypes.has(options.configuration.type)) {
                yield options;
            }
        }
    }

    protected _currentOptions: BinalyzerSessionOptions | undefined;
    get current(): BinalyzerSessionOptions | undefined {
        return this._currentOptions;
    }
    set current(option: BinalyzerSessionOptions | undefined) {
        this.updateCurrent(option);
    }
    protected updateCurrent(options: BinalyzerSessionOptions | undefined = this._currentOptions): void {
        this._currentOptions = options
            && this.find(options.configuration.name, options.workspaceFolderUri);
        if (!this._currentOptions) {
            const { model } = this;
            if (model) {
                const configuration = model.configurations[0];
                if (configuration) {
                    this._currentOptions = {
                        configuration,
                        workspaceFolderUri: model.workspaceFolderUri
                    };
                }
            }
        }
        this.binalyzerConfigurationTypeKey.set(this.current && this.current.configuration.type);
        this.onDidChangeEmitter.fire(undefined);
    }
    find(name: string, workspaceFolderUri: string | undefined): BinalyzerSessionOptions | undefined {
        for (const model of this.models.values()) {
            if (model.workspaceFolderUri === workspaceFolderUri) {
                for (const configuration of model.configurations) {
                    if (configuration.name === name) {
                        return {
                            configuration,
                            workspaceFolderUri
                        };
                    }
                }
            }
        }
        return undefined;
    }

    async openConfiguration(): Promise<void> {
        const { model } = this;
        if (model) {
            await this.doOpen(model);
        }
    }
    async addConfiguration(): Promise<void> {
        const { model } = this;
        if (!model) {
            return;
        }
        const widget = await this.doOpen(model);
        if (!(widget.editor instanceof MonacoEditor)) {
            return;
        }
        const editor = widget.editor.getControl();
        const { commandService } = widget.editor;
        let position: monaco.Position | undefined;
        let depthInArray = 0;
        let lastProperty = '';
        visit(editor.getValue(), {
            onObjectProperty: property => {
                lastProperty = property;
            },
            onArrayBegin: offset => {
                if (lastProperty === 'configurations' && depthInArray === 0) {
                    position = editor.getModel()!.getPositionAt(offset + 1);
                }
                depthInArray++;
            },
            onArrayEnd: () => {
                depthInArray--;
            }
        });
        if (!position) {
            return;
        }
        // Check if there are more characters on a line after a "configurations": [, if yes enter a newline
        if (editor.getModel()!.getLineLastNonWhitespaceColumn(position.lineNumber) > position.column) {
            editor.setPosition(position);
            editor.trigger('binalyzer', 'lineBreakInsert', undefined);
        }
        // Check if there is already an empty line to insert suggest, if yes just place the cursor
        if (editor.getModel()!.getLineLastNonWhitespaceColumn(position.lineNumber + 1) === 0) {
            editor.setPosition({ lineNumber: position.lineNumber + 1, column: 1 << 30 });
            await commandService.executeCommand('editor.action.deleteLines');
        }
        editor.setPosition(position);
        await commandService.executeCommand('editor.action.insertLineAfter');
        await commandService.executeCommand('editor.action.triggerSuggest');
    }

    protected get model(): BinalyzerConfigurationModel | undefined {
        const workspaceFolderUri = this.workspaceVariables.getWorkspaceRootUri();
        if (workspaceFolderUri) {
            const key = workspaceFolderUri.toString();
            for (const model of this.models.values()) {
                if (model.workspaceFolderUri === key) {
                    return model;
                }
            }
        }
        for (const model of this.models.values()) {
            if (model.uri) {
                return model;
            }
        }
        return this.models.values().next().value;
    }

    protected async doOpen(model: BinalyzerConfigurationModel): Promise<EditorWidget> {
        let uri = model.uri;
        if (!uri) {
            uri = await this.doCreate(model);
        }
        return this.editorManager.open(uri, {
            mode: 'activate'
        });
    }
    protected async doCreate(model: BinalyzerConfigurationModel): Promise<URI> {
        await this.preferences.set('binalyzer', {}); // create dummy launch.json in the correct place
        const { configUri } = this.preferences.resolve('binalyzer'); // get uri to write content to it
        let uri: URI;
        if (configUri && configUri.path.base === 'binalyzer.json') {
            uri = configUri;
        } else { // fallback
            uri = new URI(model.workspaceFolderUri).resolve(`${this.preferenceConfigurations.getPaths()[0]}/binalyzer.json`);
        }
        const content = this.getInitialConfigurationContent();
        let fileStat = await this.filesystem.getFileStat(uri.toString());
        if (!fileStat) {
            fileStat = await this.filesystem.createFile(uri.toString());

            try {
                await this.filesystem.setContent(fileStat, content);
            } catch (e) {
                if (!FileSystemError.FileExists.is(e)) {
                    throw e;
                }
            }
        }
        return uri;
    }

    protected async provideBinalyzerConfigurations(binalyzerType: string, workspaceFolderUri: string | undefined): Promise<BinalyzerConfiguration[]> {
        await this.fireWillProvideBinalyzerConfiguration();
        return this.binalyzer.provideBinalyzerConfigurations(binalyzerType, workspaceFolderUri);
    }
    protected async fireWillProvideBinalyzerConfiguration(): Promise<void> {
        await WaitUntilEvent.fire(this.onWillProvideBinalyzerConfigurationEmitter, {});
    }

    protected getInitialConfigurationContent(): string {
        return `{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  "version": "0.2.0",
  "configurations":
}
`;
    }

    protected async selectBinalyzerType(): Promise<string | undefined> {
        const widget = this.editorManager.currentEditor;
        if (!widget) {
            return undefined;
        }
        const { languageId } = widget.editor.document;
        const binalyzergers = await this.binalyzer.getBinalyzergersForLanguage(languageId);
        return this.quickPick.show(binalyzergers.map(
            ({ label, type }) => ({ label, value: type }),
            { placeholder: 'Select Environment' })
        );
    }

    @inject(StorageService)
    protected readonly storage: StorageService;

    async load(): Promise<void> {
        await this.initialized;
        const data = await this.storage.getData<BinalyzerConfigurationManager.Data>('binalyzer.configurations', {});
        if (data.current) {
            this.current = this.find(data.current.name, data.current.workspaceFolderUri);
        }
    }

    save(): void {
        const data: BinalyzerConfigurationManager.Data = {};
        const { current } = this;
        if (current) {
            data.current = {
                name: current.configuration.name,
                workspaceFolderUri: current.workspaceFolderUri
            };
        }
        this.storage.setData('binalyzer.configurations', data);
    }

}
export namespace BinalyzerConfigurationManager {
    export interface Data {
        current?: {
            name: string
            workspaceFolderUri?: string
        }
    }
}
