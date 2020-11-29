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
import "../../src/browser/styles/index.css";

import { BLSPClientContribution } from "@eclipse-glsp/theia-integration/lib/browser";
import { bindViewContribution, FrontendApplicationContribution, WebSocketConnectionProvider } from "@theia/core/lib/browser";
import { JsonSchemaContribution } from "@theia/core/lib/browser/json-schema-store";
import { TabBarToolbarContribution } from "@theia/core/lib/browser/shell/tab-bar-toolbar";
import { WidgetFactory } from "@theia/core/lib/browser/widget-manager";
import { ContainerModule } from "inversify";

import { BinalyzerPath, BinalyzerService } from "../common/binalyzer-service";
import { BinalyzerBLSPClientContribution } from "./binalyzer-blsp-client-contribution";
import { BinalyzerFrontendApplicationContribution } from "./binalyzer-frontend-application-contribution";
import { bindBinalyzerPreferences } from "./binalyzer-preferences";
import { BinalyzerSchemaUpdater } from "./binalyzer-schema-updater";
import { BinalyzerViewService } from "./binalyzer-view-service";
import { BinalyzerViewWidget, BinalyzerViewWidgetFactory } from "./binalyzer-view-widget";
import { bindGlobalBinalyzerPreferences } from "./preferences/binalyzer-preferences";

export default new ContainerModule(bind => {
    bind(BinalyzerViewWidgetFactory).toDynamicValue(({ container }) =>
        () => BinalyzerViewWidget.createWidget(container)
    ).inSingletonScope();

    bind(BinalyzerSchemaUpdater).toSelf().inSingletonScope();
    bind(JsonSchemaContribution).toService(BinalyzerSchemaUpdater);

    bind(BinalyzerService).toDynamicValue(context => WebSocketConnectionProvider.createProxy(context.container, BinalyzerPath)).inSingletonScope();

    bind(BinalyzerViewService).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(BinalyzerViewService);

    bindViewContribution(bind, BinalyzerFrontendApplicationContribution);
    bind(FrontendApplicationContribution).toService(BinalyzerFrontendApplicationContribution);
    bind(TabBarToolbarContribution).toService(BinalyzerFrontendApplicationContribution);

    bindBinalyzerPreferences(bind);
    bindGlobalBinalyzerPreferences(bind);

    bind(BinalyzerBLSPClientContribution).toSelf().inSingletonScope();
    bind(BLSPClientContribution).toService(BinalyzerBLSPClientContribution);
});
