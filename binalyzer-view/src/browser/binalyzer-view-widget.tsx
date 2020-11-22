/********************************************************************************
 * Copyright (C) 2017-2018 TypeFox and others.
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
import {
    ApplicationShell,
    BaseWidget,
    Message,
    PanelLayout,
    StatefulWidget,
    ViewContainer,
    Widget
} from "@theia/core/lib/browser";
import { Container, inject, injectable, interfaces, postConstruct } from "inversify";

import { BinalyzerBindingsViewModel } from "./binalyzer-bindings-view-model";
import { BinalyzerConfigurationWidget } from "./binalyzer-configuration-widget";
import { BinalyzerSessionWidget } from "./binalyzer-session-widget";


@injectable()
export class BinalyzerViewWidget extends BaseWidget implements StatefulWidget, ApplicationShell.TrackableWidgetProvider {

    static createContainer(parent: interfaces.Container): Container {
        const child = BinalyzerSessionWidget.createContainer(parent);
        child.bind(BinalyzerConfigurationWidget).toSelf();
        child.bind(BinalyzerViewWidget).toSelf();
        return child;
    }
    static createWidget(parent: interfaces.Container): BinalyzerViewWidget {
        return BinalyzerViewWidget.createContainer(parent).get(BinalyzerViewWidget);
    }

    static ID = 'binalyzer';
    static LABEL = 'Binalyzer';

    @inject(BinalyzerBindingsViewModel)
    readonly model: BinalyzerBindingsViewModel;

    @inject(BinalyzerConfigurationWidget)
    protected readonly toolbar: BinalyzerConfigurationWidget;

    @inject(BinalyzerSessionWidget)
    protected readonly sessionWidget: BinalyzerSessionWidget;

    @postConstruct()
    protected init(): void {
        this.id = BinalyzerViewWidget.ID;
        this.title.label = BinalyzerViewWidget.LABEL;
        this.title.caption = BinalyzerViewWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'binalyzer-tab-icon';
        this.addClass('theia-binalyzer-container');
        this.toDispose.pushAll([
            this.toolbar,
            this.sessionWidget
        ]);

        const layout = this.layout = new PanelLayout();
        layout.addWidget(this.toolbar);
        layout.addWidget(this.sessionWidget);
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.toolbar.focus();
    }

    getTrackableWidgets(): Widget[] {
        return this.sessionWidget.getTrackableWidgets();
    }

    storeState(): object {
        return this.sessionWidget.storeState();
    }

    restoreState(oldState: ViewContainer.State): void {
        this.sessionWidget.restoreState(oldState);
    }

}
