/********************************************************************************
 * Copyright (c) 2019-2020 EclipseSource and others.
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
import { bindContributionProvider } from "@theia/core/lib/common/contribution-provider";
import { ILogger } from "@theia/core/lib/common/logger";
import { ConnectionHandler } from "@theia/core/lib/common/messaging/handler";
import { JsonRpcConnectionHandler } from "@theia/core/lib/common/messaging/proxy-factory";
import { MessagingService } from "@theia/core/lib/node/messaging/messaging-service";
import { ContainerModule } from "inversify";

import { BLSPContribution } from "../common/blsp-contribution";
import { BinalyzerServerContribution } from "./binalyzer-blsp-server-contribution";
import { BLSPBackendContribution } from "./blsp-backend-contribution";
import { BLSPServerContribution } from "./blsp-server-contribution";

export default new ContainerModule(bind => {
    bind(BLSPServerContribution).to(BinalyzerServerContribution).inSingletonScope();

    //
    // BLSP
    //
    bind(BLSPBackendContribution).toSelf().inSingletonScope();
    bind(MessagingService.Contribution).toService(BLSPBackendContribution);
    bind(BLSPContribution.Service).toService(BLSPBackendContribution);
    bindContributionProvider(bind, BLSPServerContribution);

    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(BLSPContribution.servicePath, () =>
            ctx.container.get(BLSPContribution.Service)
        )
    ).inSingletonScope();

    bind(ILogger).toDynamicValue(ctx => {
        const logger = ctx.container.get<ILogger>(ILogger);
        return logger.child('blsp');
    }).inSingletonScope().whenTargetNamed('blsp');
});
