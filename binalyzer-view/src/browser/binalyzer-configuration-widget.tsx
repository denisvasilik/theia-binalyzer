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

import * as React from 'react';
import { injectable, inject, postConstruct } from 'inversify';
import { Disposable } from '@theia/core/lib/common';
import { ReactWidget } from '@theia/core/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { BinalyzerViewModel } from './binalyzer-view-model';
import { CommandRegistry } from '@theia/core/lib/common';

@injectable()
export class BinalyzerConfigurationWidget extends ReactWidget {

    @inject(CommandRegistry)
    protected readonly commandRegistry: CommandRegistry;

    @inject(BinalyzerViewModel)
    protected readonly viewModel: BinalyzerViewModel;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @postConstruct()
    protected init(): void {
        this.addClass('binalyzer-toolbar');
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
            <select className='theia-select debug-configuration' value={this.currentValue} onChange={this.setCurrentConfiguration}>
                {options.length ? options : <option value='__NO_CONF__'>No Configurations</option>}
                <option disabled>{'Add Configuration...'.replace(/./g, '-')}</option>
                <option value='__ADD_CONF__'>Add Configuration...</option>
            </select>
        </React.Fragment>;
    }
    protected get currentValue(): string {
        return '__NO_CONF__';
    }
    protected get options(): React.ReactNode[] {
        return []
    }

    protected readonly setCurrentConfiguration = (event: React.ChangeEvent<HTMLSelectElement>) => {};
    protected readonly start = () => {};
    protected readonly openConfiguration = () => {};
    protected readonly openConsole = () => {};

}
