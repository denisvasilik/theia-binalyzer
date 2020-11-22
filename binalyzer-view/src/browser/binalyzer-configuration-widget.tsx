/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
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
import { ReactWidget } from "@theia/core/lib/browser";
import { CommandRegistry, Disposable } from "@theia/core/lib/common";
import URI from "@theia/core/lib/common/uri";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { inject, injectable, postConstruct } from "inversify";
import * as React from "react";

import { BinalyzerConfigurationManager } from "./binalyzer-configuration-manager";
import { BinalyzerSessionOptions } from "./binalyzer-session-options";
import { BinalyzerViewModel } from "./binalyzer-view-model";


@injectable()
export class BinalyzerConfigurationWidget extends ReactWidget {

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(BinalyzerViewModel)
    protected readonly viewModel: BinalyzerViewModel;

    @inject(BinalyzerConfigurationManager)
    protected readonly manager: BinalyzerConfigurationManager;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @postConstruct()
    protected init(): void {
        this.addClass('binalyzer-toolbar');
        this.toDispose.push(this.manager.onDidChange(() => this.update()));
        this.toDispose.push(this.workspaceService.onWorkspaceChanged(() => this.update()));
        this.toDispose.push(this.workspaceService.onWorkspaceLocationChanged(() => this.update()));
        this.scrollOptions = undefined;
        this.update();
    }

    focus(): void {
        if (!this.doFocus()) {
            this.onRender.push(Disposable.create(() => this.doFocus()));
            this.update();
        }
    }
    protected doFocus(): boolean {
        return true;
    }

    render(): React.ReactNode {
        const { options } = this;
        return <React.Fragment>
            <select className='theia-select binalyzer-configuration' value={this.currentValue} onChange={this.setCurrentConfiguration}>
                {options.length ? options : <option value='__NO_CONF__'>No Bindings</option>}
                <option disabled>{'Add Bindings...'.replace(/./g, '-')}</option>
                <option value='__ADD_CONF__'>Add Bindings...</option>
            </select>
        </React.Fragment>;
    }
    protected get currentValue(): string {
        const { current } = this.manager;
        return current ? this.toValue(current) : '__NO_CONF__';
    }
    protected get options(): React.ReactNode[] {
        return Array.from(this.manager.all).map((options, index) =>
            <option key={index} value={this.toValue(options)}>{this.toName(options)}</option>
        );
    }
    protected toValue({ configuration, workspaceFolderUri }: BinalyzerSessionOptions): string {
        if (!workspaceFolderUri) {
            return configuration.name;
        }
        return configuration.name + '__CONF__' + workspaceFolderUri;
    }
    protected toName({ configuration, workspaceFolderUri }: BinalyzerSessionOptions): string {
        if (!workspaceFolderUri || !this.workspaceService.isMultiRootWorkspaceOpened) {
            return configuration.name;
        }
        return configuration.name + ' (' + new URI(workspaceFolderUri).path.base + ')';
    }

    protected readonly setCurrentConfiguration = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.currentTarget.value;
        if (value === '__ADD_CONF__') {
            this.manager.addConfiguration();
        } else {
            const [name, workspaceFolderUri] = value.split('__CONF__');
            this.manager.current = this.manager.find(name, workspaceFolderUri);
        }
    }

    protected readonly start = () => { };

    protected readonly openConfiguration = () => this.manager.openConfiguration();

}
