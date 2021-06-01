import axios from 'axios';
import * as fs from 'fs';
import path from 'path';

async function main(): Promise<void> {
    if (process.argv.length < 4) {
        // arguments: type (user or group), userOrGroupID, apiKey (optional)
        console.error('Arguments: type (user or group), userOrGroupID, apiKey (optional)');
        process.exit(1);
    }
    const t: 'user' | 'group' = process.argv[2] as 'user' | 'group';
    if (t !== 'user' && t !== 'group') {
        console.error('Type must be \'user\' or \'group\'');
        process.exit(1);
    }
    const id: string = process.argv[3];
    const literatures = await library2json(t, id);
    fs.writeFileSync(path.join(__dirname, '..', 'paper_list.js'), 'const paper_list ='+JSON.stringify(literatures, null, 2));
}

interface LiteratureMetadata {
    title: string,
    link: string,
    authors: string[],
    venue: string,
    year: number,
    tags: string[],
}

interface ZoteroItem {
    key: string,
    data: {
        key: string,
        version: string,
        itemType: string,
        title: string,
        creators: {
            creatorType: string,
            firstName: string,
            lastName: string,
        }[]
        date: string,
        proceedingsTitle?: string,
        conferenceName?: string,
        publicationTitle?: string,
        url: string,
        doi: string,
        tags: {
            tag: string,
            type: number,
        }[],
    }
}

async function library2json(t: 'user' | 'group', id: string): Promise<LiteratureMetadata[]> {
    const literatures: LiteratureMetadata[] = [];
    let data: ZoteroItem[] = [];
    do {
        const resp = await axios.get(`https://api.zotero.org/${t}s/${id}/items`, {
            headers: {
                'Zotero-API-Version': 3,
            },
            params: {
                format: 'json',
                itemType: 'journalArticle || conferencePaper',
                start: literatures.length,
                limit: 100,
            }
        });
        data = resp.data;
        console.log(`Fetched ${data.length} items from Zotero`);
        literatures.push(...zoteroItem2Metadata(data));
    } while (data.length >= 100);
    return literatures;
}

function zoteroItem2Metadata(items: ZoteroItem[]): LiteratureMetadata[] {
    const literatures: LiteratureMetadata[] = [];
    for (const item of items) {
        if (item.data.conferenceName === '') item.data.conferenceName = undefined;
        if (item.data.proceedingsTitle === '') item.data.proceedingsTitle = undefined;
        if (item.data.publicationTitle === '') item.data.publicationTitle = undefined;
        const venue = item.data.conferenceName ?? item.data.proceedingsTitle ?? item.data.publicationTitle ?? '';

        const date = new Date(item.data.date);
        const year = date.getFullYear();
        literatures.push({
            title: item.data.title,
            link: item.data.url,
            authors: item.data.creators.map(c => `${c.firstName} ${c.lastName}`),
            venue,
            year,
            tags: item.data.tags.map(t=>t.tag),
        });
    }
    return literatures;
}

if (require.main === module) {
    main().catch(console.error);
}