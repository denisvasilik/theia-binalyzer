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

import { ContainerModule } from 'inversify';
import { BinalyzerViewService } from './binalyzer-view-service';
import { BinalyzerFrontendApplicationContribution } from './binalyzer-frontend-application-contribution';
import { WidgetFactory } from '@theia/core/lib/browser/widget-manager';
import {
    FrontendApplicationContribution,
    bindViewContribution,
} from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { BinalyzerViewWidget } from './binalyzer-view-widget';
import '../../src/browser/styles/index.css';
import { BinalyzerSessionWidget, BinalyzerSessionWidgetFactory } from './binalyzer-session-widget';

export default new ContainerModule(bind => {
    bind(BinalyzerSessionWidgetFactory).toDynamicValue(({ container }) =>
        () => BinalyzerSessionWidget.createWidget(container)
    ).inSingletonScope();

    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: BinalyzerViewWidget.ID,
        createWidget: () => BinalyzerViewWidget.createWidget(container)
    })).inSingletonScope();

    bind(BinalyzerViewService).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(BinalyzerViewService);

    bindViewContribution(bind, BinalyzerFrontendApplicationContribution);
    bind(FrontendApplicationContribution).toService(BinalyzerFrontendApplicationContribution);
    bind(TabBarToolbarContribution).toService(BinalyzerFrontendApplicationContribution);
});
