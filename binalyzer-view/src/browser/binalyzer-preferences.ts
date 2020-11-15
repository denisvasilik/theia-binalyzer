/********************************************************************************
 * Copyright (C) 2018 Ericsson and others.
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
    createPreferenceProxy,
    PreferenceContribution,
    PreferenceProxy,
    PreferenceSchema,
    PreferenceService
} from "@theia/core/lib/browser/preferences";
import { interfaces } from "inversify";


export const binalyzerPreferencesSchema: PreferenceSchema = {
    type: 'object',
    properties: {
        'binalyzer.trace': {
            type: 'boolean',
            default: false,
            description: 'Enable/disable tracing communications with binalyzer adapters'
        },
        'binalyzer.binalyzerViewLocation': {
            enum: ['default', 'left', 'right', 'bottom'],
            default: 'default',
            description: 'Controls the location of the binalyzer view.'
        },
        'binalyzer.openBinalyzer': {
            enum: ['neverOpen', 'openOnSessionStart', 'openOnFirstSessionStart', 'openOnBinalyzerBreak'],
            default: 'openOnSessionStart',
            description: 'Controls when the binalyzer view should open.'
        },
        'binalyzer.internalConsoleOptions': {
            enum: ['neverOpen', 'openOnSessionStart', 'openOnFirstSessionStart'],
            default: 'openOnFirstSessionStart',
            description: 'Controls when the internal binalyzer console should open.'
        },
        'binalyzer.inlineValues': {
            type: 'boolean',
            default: false,
            description: 'Show variable values inline in editor while binalyzerging.'
        },
        'binalyzer.showInStatusBar': {
            enum: ['never', 'always', 'onFirstSessionStart'],
            description: 'Controls when the binalyzer status bar should be visible.',
            default: 'onFirstSessionStart'
        }
    }
};

export class BinalyzerConfiguration {
    'binalyzer.trace': boolean;
    'binalyzer.binalyzerViewLocation': 'default' | 'left' | 'right' | 'bottom';
    'binalyzer.openBinalyzer': 'neverOpen' | 'openOnSessionStart' | 'openOnFirstSessionStart' | 'openOnBinalyzerBreak';
    'binalyzer.internalConsoleOptions': 'neverOpen' | 'openOnSessionStart' | 'openOnFirstSessionStart';
    'binalyzer.inlineValues': boolean;
    'binalyzer.showInStatusBar': 'never' | 'always' | 'onFirstSessionStart';
}

export const BinalyzerPreferences = Symbol('BinalyzerPreferences');
export type BinalyzerPreferences = PreferenceProxy<BinalyzerConfiguration>;

export function createBinalyzerPreferences(preferences: PreferenceService): BinalyzerPreferences {
    return createPreferenceProxy(preferences, binalyzerPreferencesSchema);
}

export function bindBinalyzerPreferences(bind: interfaces.Bind): void {
    bind(BinalyzerPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService);
        return createBinalyzerPreferences(preferences);
    }).inSingletonScope();

    bind(PreferenceContribution).toConstantValue({ schema: binalyzerPreferencesSchema });
}
