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
import { BinalyzerBindingsViewWidget } from "./binalyzer-bindings-view-widget";
import { BinalyzerConfigurationWidget } from "./binalyzer-configuration-widget";
import { BinalyzerToolBar } from "./binalyzer-toolbar-widget";


export const BinalyzerSessionWidgetFactory = Symbol('BinalyzerSessionWidgetFactory');
export type BinalyzerSessionWidgetFactory = () => BinalyzerSessionWidget;

@injectable()
export class BinalyzerSessionWidget extends BaseWidget implements StatefulWidget, ApplicationShell.TrackableWidgetProvider {

    static createContainer(parent: interfaces.Container): Container {
        const child = new Container({ defaultScope: 'Singleton' });
        child.parent = parent;
        child.bind(BinalyzerBindingsViewModel).toSelf();
        child.bind(BinalyzerToolBar).toSelf();
        child.bind(BinalyzerConfigurationWidget).toSelf();
        child.bind(BinalyzerBindingsViewWidget).toDynamicValue(({ container }) => BinalyzerBindingsViewWidget.createWidget(container));
        child.bind(BinalyzerSessionWidget).toSelf();
        return child;
    }

    static createWidget(parent: interfaces.Container): BinalyzerSessionWidget {
        return BinalyzerSessionWidget.createContainer(parent).get(BinalyzerSessionWidget);
    }

    protected viewContainer: ViewContainer;

    @inject(ViewContainer.Factory)
    protected readonly viewContainerFactory: ViewContainer.Factory;

    @inject(BinalyzerBindingsViewModel)
    readonly model: BinalyzerBindingsViewModel;

    @inject(BinalyzerToolBar)
    protected readonly toolbar: BinalyzerToolBar;

    @inject(BinalyzerConfigurationWidget)
    protected readonly configuration: BinalyzerConfigurationWidget;

    @inject(BinalyzerBindingsViewWidget)
    protected readonly templates: BinalyzerBindingsViewWidget;

    @postConstruct()
    protected init(): void {
        this.id = 'binalyzer:session:' + this.model.id;
        this.title.label = this.model.label;
        this.title.caption = this.model.label;
        this.title.closable = true;
        this.title.iconClass = 'binalyzer-tab-icon';
        this.addClass('theia-session-container');

        this.viewContainer = this.viewContainerFactory({
            id: 'binalyzer:view-container:' + this.model.id
        });
        this.viewContainer.addWidget(this.templates, { weight: 30 });

        this.toDispose.pushAll([
            this.toolbar,
            this.configuration,
            this.viewContainer
        ]);

        const layout = this.layout = new PanelLayout();
        layout.addWidget(this.toolbar);
        layout.addWidget(this.configuration);
        layout.addWidget(this.viewContainer);
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.toolbar.focus();
    }

    getTrackableWidgets(): Widget[] {
        return this.viewContainer.getTrackableWidgets();
    }

    storeState(): object {
        return this.viewContainer.storeState();
    }

    restoreState(oldState: ViewContainer.State): void {
        this.viewContainer.restoreState(oldState);
    }

}
