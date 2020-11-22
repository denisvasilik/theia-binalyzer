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
import { BaseWidget, Message, PanelLayout, ViewContainer } from "@theia/core/lib/browser";
import { Container, inject, injectable, interfaces, postConstruct } from "inversify";

import { BinalyzerBindingsViewWidget } from "./binalyzer-bindings-view-widget";
import { BinalyzerConfigurationWidget } from "./binalyzer-configuration-widget";
import { BinalyzerViewModel } from "./binalyzer-view-model";

export type BinalyzerViewWidgetFactory = () => BinalyzerViewWidget;
export const BinalyzerViewWidgetFactory = Symbol('BinalyzerViewWidgetFactory');

@injectable()
export class BinalyzerViewWidget extends BaseWidget {

    static createContainer(parent: interfaces.Container): Container {
        const child = new Container({ defaultScope: 'Singleton' });
        child.parent = parent;
        child.bind(BinalyzerViewModel).toSelf();
        child.bind(BinalyzerConfigurationWidget).toSelf();
        child.bind(BinalyzerBindingsViewWidget).toDynamicValue(({ container }) => BinalyzerBindingsViewWidget.createWidget(container));
        child.bind(BinalyzerViewWidget).toSelf();
        return child;
    }
    static createWidget(parent: interfaces.Container): BinalyzerViewWidget {
        return BinalyzerViewWidget.createContainer(parent).get(BinalyzerViewWidget);
    }

    static ID = 'binalyzer';
    static LABEL = 'Binalyzer';

    protected viewContainer: ViewContainer;

    @inject(ViewContainer.Factory)
    protected readonly viewContainerFactory: ViewContainer.Factory;

    @inject(BinalyzerViewModel)
    readonly model: BinalyzerViewModel;

    @inject(BinalyzerConfigurationWidget)
    protected readonly configuration: BinalyzerConfigurationWidget;

    @inject(BinalyzerBindingsViewWidget)
    public readonly bindings: BinalyzerBindingsViewWidget;

    @postConstruct()
    protected init(): void {
        this.id = BinalyzerViewWidget.ID;
        this.title.label = BinalyzerViewWidget.LABEL;
        this.title.caption = BinalyzerViewWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'binalyzer-tab-icon';
        this.addClass('theia-binalyzer-container');

        this.viewContainer = this.viewContainerFactory({
            id: 'binalyzer:view-container:' + this.model.id
        });
        this.viewContainer.addWidget(this.bindings, { weight: 30 });

        this.toDispose.pushAll([
            this.configuration,
            this.viewContainer
        ]);
        const layout = this.layout = new PanelLayout();
        layout.addWidget(this.configuration);
        layout.addWidget(this.viewContainer);
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.configuration.focus();
    }
}
