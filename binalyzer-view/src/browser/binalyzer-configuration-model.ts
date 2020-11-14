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
import { PreferenceService } from "@theia/core/lib/browser/preferences/preference-service";
import { Disposable, DisposableCollection } from "@theia/core/lib/common/disposable";
import { Emitter, Event } from "@theia/core/lib/common/event";
import URI from "@theia/core/lib/common/uri";

import { BinalyzerConfiguration } from "../common/binalyzer-common";


export class BinalyzerConfigurationModel implements Disposable {

    protected json: BinalyzerConfigurationModel.JsonContent;

    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;

    protected readonly toDispose = new DisposableCollection(
        this.onDidChangeEmitter
    );

    constructor(
        readonly workspaceFolderUri: string,
        protected readonly preferences: PreferenceService
    ) {
        this.reconcile();
        this.toDispose.push(this.preferences.onPreferenceChanged(e => {
            if (e.preferenceName === 'binalyzer' && e.affects(workspaceFolderUri)) {
                this.reconcile();
            }
        }));
    }

    get uri(): URI | undefined {
        return this.json.uri;
    }

    dispose(): void {
        this.toDispose.dispose();
    }
    get onDispose(): Event<void> {
        return this.toDispose.onDispose;
    }

    get configurations(): BinalyzerConfiguration[] {
        return this.json.configurations;
    }

    async reconcile(): Promise<void> {
        this.json = this.parseConfigurations();
        this.onDidChangeEmitter.fire(undefined);
    }
    protected parseConfigurations(): BinalyzerConfigurationModel.JsonContent {
        const configurations: BinalyzerConfiguration[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { configUri, value } = this.preferences.resolve<any>('binalyzer', undefined, this.workspaceFolderUri);
        if (value && typeof value === 'object' && 'configurations' in value) {
            if (Array.isArray(value.configurations)) {
                for (const configuration of value.configurations) {
                    if (BinalyzerConfiguration.is(configuration)) {
                        configurations.push(configuration);
                    }
                }
            }
        }
        return {
            uri: configUri,
            configurations
        };
    }

}
export namespace BinalyzerConfigurationModel {
    export interface JsonContent {
        uri?: URI
        configurations: BinalyzerConfiguration[]
    }
}
