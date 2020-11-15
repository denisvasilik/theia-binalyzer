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
import { JsonSchemaContribution, JsonSchemaRegisterContext } from "@theia/core/lib/browser/json-schema-store";
import { deepClone, InMemoryResources } from "@theia/core/lib/common";
import { IJSONSchema } from "@theia/core/lib/common/json-schema";
import URI from "@theia/core/lib/common/uri";
import { inputsSchema } from "@theia/variable-resolver/lib/browser/variable-input-schema";
import { inject, injectable, postConstruct } from "inversify";

import { BinalyzerService } from "../common/binalyzer-service";
import { binalyzerPreferencesSchema } from "./binalyzer-preferences";


@injectable()
export class BinalyzerSchemaUpdater implements JsonSchemaContribution {

    protected readonly uri = new URI(binalyzerSchemaId);

    @inject(InMemoryResources) protected readonly inmemoryResources: InMemoryResources;
    @inject(BinalyzerService) protected readonly binalyzer: BinalyzerService;

    @postConstruct()
    protected init(): void {
        this.inmemoryResources.add(this.uri, '');
    }

    registerSchemas(context: JsonSchemaRegisterContext): void {
        context.registerSchema({
            fileMatch: ['binalyzer.json'],
            url: this.uri.toString()
        });
    }

    async update(): Promise<void> {
        const types = await this.binalyzer.binalyzerTypes();
        const schema = { ...deepClone(binalyzerSchema) };
        const items = (<IJSONSchema>schema!.properties!['configurations'].items);

        const attributePromises = types.map(type => this.binalyzer.getSchemaAttributes(type));
        for (const attributes of await Promise.all(attributePromises)) {
            for (const attribute of attributes) {
                const properties: typeof attribute['properties'] = {};
                for (const key of ['binalyzerViewLocation', 'openBinalyzer', 'internalConsoleOptions']) {
                    properties[key] = binalyzerPreferencesSchema.properties[`binalyzer.${key}`];
                }
                attribute.properties = { ...properties, ...attribute.properties };
                items.oneOf!.push(attribute);
            }
        }
        items.defaultSnippets!.push(...await this.binalyzer.getConfigurationSnippets());

        const contents = JSON.stringify(schema);
        this.inmemoryResources.update(this.uri, contents);
    }
}

export const binalyzerSchemaId = 'vscode://schemas/binalyzer';
const binalyzerSchema: IJSONSchema = {
    $id: binalyzerSchemaId,
    type: 'object',
    title: 'Launch',
    required: [],
    default: { version: '0.2.0', configurations: [] },
    properties: {
        version: {
            type: 'string',
            description: 'Version of this file format.',
            default: '0.2.0'
        },
        configurations: {
            type: 'array',
            description: 'List of configurations. Add new configurations or edit existing ones by using IntelliSense.',
            items: {
                defaultSnippets: [],
                'type': 'object',
                oneOf: []
            }
        },
        inputs: inputsSchema.definitions!.inputs
    }
};
