/********************************************************************************
 * Copyright (C) 2018 Red Hat, Inc. and others.
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
import { Disposable } from "@theia/core";
import { ApplicationError } from "@theia/core/lib/common/application-error";
import { IJSONSchema, IJSONSchemaSnippet } from "@theia/core/lib/common/json-schema";

import { BinalyzerConfiguration } from "./binalyzer-configuration";


/* eslint-disable @typescript-eslint/no-explicit-any */

export interface BinalyzergerDescription {
    type: string
    label: string
}

/**
 * The WS endpoint path to the Binalyzer service.
 */
export const BinalyzerPath = '/services/binalyzer';

/**
 * BinalyzerService symbol for DI.
 */
export const BinalyzerService = Symbol('BinalyzerService');

/**
 * This service provides functionality to configure and to start a new binalyzer adapter session.
 * The workflow is the following. If user wants to binalyzer an application and
 * there is no binalyzer configuration associated with the application then
 * the list of available providers is requested to create suitable binalyzer configuration.
 * When configuration is chosen it is possible to alter the configuration
 * by filling in missing values or by adding/changing/removing attributes. For this purpose the
 * #resolveBinalyzerConfiguration method is invoked. After that the binalyzer adapter session will be started.
 */
export interface BinalyzerService extends Disposable {
    /**
     * Finds and returns an array of registered binalyzer types.
     * @returns An array of registered binalyzer types
     */
    binalyzerTypes(): Promise<string[]>;

    getBinalyzergersForLanguage(language: string): Promise<BinalyzergerDescription[]>;

    /**
     * Provides the schema attributes.
     * @param binalyzerType The registered binalyzer type
     * @returns An JSON Schema describing the configuration attributes for the given binalyzer type
     */
    getSchemaAttributes(binalyzerType: string): Promise<IJSONSchema[]>;

    getConfigurationSnippets(): Promise<IJSONSchemaSnippet[]>;

    /**
     * Provides initial [binalyzer configuration](#BinalyzerConfiguration).
     * @param binalyzerType The registered binalyzer type
     * @returns An array of [binalyzer configurations](#BinalyzerConfiguration)
     */
    provideBinalyzerConfigurations(binalyzerType: string, workspaceFolderUri: string | undefined): Promise<BinalyzerConfiguration[]>;

    /**
     * Resolves a [binalyzer configuration](#BinalyzerConfiguration) by filling in missing values
     * or by adding/changing/removing attributes before variable substitution.
     * @param binalyzerConfiguration The [binalyzer configuration](#BinalyzerConfiguration) to resolve.
     * @returns The resolved binalyzer configuration.
     */
    resolveBinalyzerConfiguration(config: BinalyzerConfiguration, workspaceFolderUri: string | undefined): Promise<BinalyzerConfiguration>;

    /**
     * Resolves a [binalyzer configuration](#BinalyzerConfiguration) by filling in missing values
     * or by adding/changing/removing attributes with substituted variables.
     * @param binalyzerConfiguration The [binalyzer configuration](#BinalyzerConfiguration) to resolve.
     * @returns The resolved binalyzer configuration.
     */
    resolveBinalyzerConfigurationWithSubstitutedVariables(config: BinalyzerConfiguration, workspaceFolderUri: string | undefined): Promise<BinalyzerConfiguration>;

    /**
     * Creates a new [binalyzer adapter session](#BinalyzerAdapterSession).
     * @param config The resolved [binalyzer configuration](#BinalyzerConfiguration).
     * @returns The identifier of the created [binalyzer adapter session](#BinalyzerAdapterSession).
     */
    createBinalyzerSession(config: BinalyzerConfiguration): Promise<string>;

    /**
     * Stop a running session for the given session id.
     */
    terminateBinalyzerSession(sessionId: string): Promise<void>;
}

/**
 * The endpoint path to the binalyzer adapter session.
 */
export const BinalyzerAdapterPath = '/services/binalyzer-adapter';

export namespace BinalyzerError {
    export const NotFound = ApplicationError.declare(-41000, (type: string) => ({
        message: `'${type}' binalyzerger type is not supported.`,
        data: { type }
    }));
}
