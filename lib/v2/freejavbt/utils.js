const got = require('@/utils/got');
const cheerio = require('cheerio');
const { parseDate } = require('@/utils/parse-date');

module.exports = {
    ProcessItems: async (ctx, currentUrl, title) => {
        const domain = ctx.query.domain ?? 'freejavbt.com';
        const url = new URL(currentUrl, `https://${domain}`);

        const links = [];
        for (let i = 1; i < 5; i++) {
            links.push(new URL(`${currentUrl}?page=${i}`, `https://${domain}`));
        }

        let items = await Promise.all(
            links.map(async (link) => {
                const listResponse = await got({
                    method: 'get',
                    url: link.href,
                });
                const $ = cheerio.load(listResponse.data);
                return $('.card-body')
                    .toArray()
                    .map((item) => {
                        item = $(item);
                        return {
                            title: item.find('.card-text').text(),
                            link: item.find('a').attr('href'),
                            pubData: parseDate(item.find('.text-muted').text()),
                        };
                    });
            })
        );

        items = items.flat();

        items = await Promise.all(
            items.map((item) =>
                ctx.cache.tryGet(item.link, async () => {
                    const detailResponse = await got({
                        method: 'get',
                        url: item.link,
                    });

                    const content = cheerio.load(detailResponse.data);

                    item.enclosure_type = 'application/x-bittorrent';
                    item.enclosure_url = content('button[data-clipboard-text]').first().attr('data-clipboard-text');

                    item.category = content('.btn.btn-danger.btn-sm')
                        .toArray()
                        .map((v) => content(v).text());
                    item.author = content('.actress').text();
                    item.description = content('meta[name="description"]').attr('content');

                    return item;
                })
            )
        );

        return {
            title,
            link: url.href,
            item: items,
        };
    },
};
