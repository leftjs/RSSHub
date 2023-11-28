const got = require('@/utils/got');
const cheerio = require('cheerio');
const { parseDate } = require('@/utils/parse-date');


module.exports = {
    ProcessItems: async (ctx, currentUrl, title) => {
        const domain = ctx.query.domain ?? 'freejavbt.com';
        const url = new URL(currentUrl, `https://${domain}`);

        const links = [];
        for (let i = 1;i < 5;i++) {
            links.push(new URL(`${currentUrl}?page=${i}`, `https://${domain}`));
        }

        const items = await Promise.all(
            links.map(async (link) => {
                const listResponse = await got({
                    method: 'get',
                    url: link.href
                });
                const $ = cheerio.load(listResponse.data);
                return $('.card-body').toArray()
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


        // items = await Promise.all(
        //     items.map((item) =>
        //         ctx.cache.tryGet(item.link, async () => {
        //             const detailResponse = await got({
        //                 method: 'get',
        //                 url: item.link,
        //             });

        //             const content = cheerio.load(detailResponse.data);

        //             item.enclosure_type = 'application/x-bittorrent';
        //             item.enclosure_url = content('#magnets-content button[data-clipboard-text]').first().attr('data-clipboard-text');

        //             content('icon').remove();
        //             content('#modal-review-watched, #modal-comment-warning, #modal-save-list').remove();
        //             content('.review-buttons, .copy-to-clipboard, .preview-video-container, .play-button').remove();

        //             content('.preview-images img').each(function () {
        //                 content(this).removeAttr('data-src');
        //                 content(this).attr('src', content(this).parent().attr('href'));
        //             });

        //             item.category = content('.panel-block .value a')
        //                 .toArray()
        //                 .map((v) => content(v).text());
        //             item.author = content('.panel-block .value').last().parent().find('.value a').first().text();
        //             item.description = content('.cover-container, .column-video-cover').html() + content('.movie-panel-info').html() + content('#magnets-content').html() + content('.preview-images').html();

        //             return item;
        //         })
        //     )
        // );


        return {
            title,
            link: url.href,
            item: items,
        };
    },
};
