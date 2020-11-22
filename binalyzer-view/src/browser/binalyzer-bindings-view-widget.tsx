/********************************************************************************
 * Copyright (C) 2019 TypeFox and others.
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
import { defaultTreeProps, TreeProps, TreeWidget } from "@theia/core/lib/browser";
import { Container, inject, injectable, interfaces, postConstruct } from "inversify";

import { BinalyzerBindingsViewModel } from "./binalyzer-bindings-view-model";


@injectable()
export class BinalyzerBindingsViewWidget extends TreeWidget {

    @inject(TreeProps)
    protected readonly treeProps: TreeProps;

    @inject(BinalyzerBindingsViewModel)
    readonly viewModel: BinalyzerBindingsViewModel;

    static createContainer(parent: interfaces.Container): Container {
        const child = new Container({ defaultScope: 'Singleton' });
        child.parent = parent;
        child.rebind(TreeProps).toConstantValue({ ...defaultTreeProps, search: true });
        child.bind(BinalyzerBindingsViewWidget).toSelf();
        return child;
    }

    static createWidget(parent: interfaces.Container): BinalyzerBindingsViewWidget {
        return BinalyzerBindingsViewWidget.createContainer(parent).get(BinalyzerBindingsViewWidget);
    }

    @postConstruct()
    protected init(): void {
        super.init();
        this.id = 'binalyzer:template:' + this.viewModel.id;
        this.title.label = 'Bindings';
    }

}
