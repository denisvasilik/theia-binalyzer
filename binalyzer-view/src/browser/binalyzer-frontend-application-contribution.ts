/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
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
import { LabelProvider } from "@theia/core/lib/browser";
import { FrontendApplication, FrontendApplicationContribution } from "@theia/core/lib/browser/frontend-application";
import { TabBarToolbarContribution, TabBarToolbarRegistry } from "@theia/core/lib/browser/shell/tab-bar-toolbar";
import { AbstractViewContribution } from "@theia/core/lib/browser/shell/view-contribution";
import { Widget } from "@theia/core/lib/browser/widgets";
import { Command, CommandRegistry } from "@theia/core/lib/common/command";
import { ContributionProvider } from "@theia/core/lib/common/contribution-provider";
import { OS } from "@theia/core/lib/common/os";
import { inject, injectable, named } from "inversify";

import { BinalyzerViewService } from "./binalyzer-view-service";
import { BinalyzerViewWidget } from "./binalyzer-view-widget";
import { BLSPClientContribution } from "./blsp-client-contribution";

export const BINALYZER_WIDGET_FACTORY_ID = 'binalyzer-view';

/**
 * Collection of `binalyzer-view` commands.
 */
export namespace BinalyzerViewCommands {
    /**
     * Command which collapses all nodes
     * from the `binalyzer-view` tree.
     */
    export const COLLAPSE_ALL: Command = {
        id: 'binalyzerView.collapse.all',
        iconClass: 'collapse-all'
    };
}

@injectable()
export class BinalyzerFrontendApplicationContribution extends AbstractViewContribution<BinalyzerViewWidget> implements FrontendApplicationContribution, TabBarToolbarContribution {

    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;

    @inject(BinalyzerViewService) protected readonly binalyzerViewService: BinalyzerViewService;

    @inject(ContributionProvider) @named(BLSPClientContribution)
    protected readonly BLSPcontributions: ContributionProvider<BLSPClientContribution>;

    constructor() {
        super({
            widgetId: BINALYZER_WIDGET_FACTORY_ID,
            widgetName: 'Binalyzer',
            defaultWidgetOptions: {
                area: 'left',
                rank: 500
            },
            toggleCommandId: 'binalyzerView:toggle',
            toggleKeybinding: OS.type() !== OS.Type.Linux
                ? 'ctrlcmd+shift+i'
                : undefined
        });
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView();
    }

    onStart(app: FrontendApplication): void {
        for (const contribution of this.BLSPcontributions.getContributions()) {
            contribution.activate(app);
        }
    }

    onStop(app: FrontendApplication): void {
        for (const contribution of this.BLSPcontributions.getContributions()) {
            contribution.deactivate(app);
        }
    }

    registerCommands(commands: CommandRegistry): void {
        super.registerCommands(commands);
    }

    registerToolbarItems(toolbar: TabBarToolbarRegistry): void {

    }

    /**
     * Determine if the current widget is the `binalyzer-view`.
     */
    protected withWidget<T>(widget: Widget | undefined = this.tryGetWidget(), cb: (widget: BinalyzerViewWidget) => T): T | false {
        if (widget instanceof BinalyzerViewWidget && widget.id === BINALYZER_WIDGET_FACTORY_ID) {
            return cb(widget);
        }
        return false;
    }
}
