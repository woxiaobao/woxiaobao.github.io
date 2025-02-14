interface SearchConfig {
    url: string;
    form: string;
    input: string;
    resultTitle: string;
    resultList: string;
}

interface SearchItem {
    title: string;
    date: string;
    permalink: string;
    content: string;
}

class Search {
    private data: SearchItem[];
    private form: HTMLFormElement;
    private input: HTMLInputElement;
    private list: HTMLDivElement;
    private resultTitle: HTMLHeadingElement;
    private resultTitleTemplate: string;

    constructor({ form, input, list, resultTitle, resultTitleTemplate }: SearchConfig) {
        this.form = document.querySelector(form);
        this.input = document.querySelector(input);
        this.list = document.querySelector(list);
        this.resultTitle = document.querySelector(resultTitle);
        this.resultTitleTemplate = resultTitleTemplate;

        this.handleQueryString();
        this.bindQueryStringChange();
        this.bindSearchForm();

        // 初始化搜索数据
        fetch(window.searchConfig.url)
            .then(response => response.json())
            .then(data => {
                this.data = data;
                const urlParams = new URLSearchParams(window.location.search);
                const keyword = urlParams.get('keyword');
                if (keyword) {
                    this.input.value = keyword;
                    this.doSearch(keyword.split(' '));
                }
            });
    }

    private static processMatches(str: string, matches: string[], ellipsis = true, charLimit = 140, offset = 20): string {
        if (!matches || matches.length === 0) return str.substring(0, charLimit);
        
        matches.sort((a, b) => a.length - b.length);
        let result = '';
        let lastIndex = 0;

        for (const match of matches) {
            if (!match) continue;
            const index = str.toLowerCase().indexOf(match.toLowerCase(), lastIndex);
            if (index === -1) continue;

            const startIndex = Math.max(0, index - offset);
            const endIndex = Math.min(str.length, index + match.length + offset);

            if (startIndex > lastIndex) {
                result += (startIndex > 0 ? '... ' : '') + str.substring(startIndex, index);
            }

            result += `<mark>${str.substring(index, index + match.length)}</mark>`;
            lastIndex = index + match.length;

            if (endIndex > lastIndex) {
                result += str.substring(lastIndex, endIndex) + (endIndex < str.length ? ' ... ' : '');
            }
        }

        return result || str.substring(0, charLimit);
    }

    private doSearch(keywords: string[]) {
        const normalizedKeywords = keywords
            .map(keyword => keyword.toLowerCase().trim())
            .filter(k => k.length > 0);

        if (normalizedKeywords.length === 0) {
            this.clear();
            return;
        }

        const results = this.data.filter(item => {
            const titleMatches = normalizedKeywords.some(keyword =>
                item.title.toLowerCase().includes(keyword)
            );
            const contentMatches = normalizedKeywords.some(keyword =>
                item.content.toLowerCase().includes(keyword)
            );
            
            return titleMatches || contentMatches;
        });

        this.clear();
        this.updateResultTitle(results.length);

        results.forEach(item => {
            const element = document.createElement('article');
            element.className = 'search-result';

            const title = document.createElement('h3');
            const link = document.createElement('a');
            link.href = item.permalink;
            link.textContent = item.title;
            title.appendChild(link);

            const date = document.createElement('time');
            date.textContent = new Date(item.date).toLocaleDateString();
            date.className = 'search-result-date';

            const content = document.createElement('p');
            const matches = normalizedKeywords.map(keyword => {
                const index = item.content.toLowerCase().indexOf(keyword);
                return index !== -1 ? item.content.substr(index, keyword.length) : '';
            }).filter(Boolean);

            content.innerHTML = Search.processMatches(item.content, matches);
            content.className = 'search-result-content';

            element.appendChild(title);
            element.appendChild(date);
            element.appendChild(content);

            this.list.appendChild(element);
        });
    }

    private updateResultTitle(count: number) {
        this.resultTitle.textContent = this.resultTitleTemplate.replace('#PAGES_COUNT', count.toString());
    }

    private clear() {
        this.list.innerHTML = '';
        this.resultTitle.textContent = '';
    }

    private handleQueryString() {
        const urlParams = new URLSearchParams(window.location.search);
        const keyword = urlParams.get('keyword');

        if (keyword) {
            this.input.value = keyword;
            this.doSearch(keyword.split(' '));
        }
    }

    private bindQueryStringChange() {
        window.addEventListener('popstate', () => {
            this.handleQueryString();
        });
    }

    private bindSearchForm() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const keywords = this.input.value.trim();

            if (keywords.length === 0) {
                this.clear();
                return;
            }

            const url = new URL(window.location.toString());
            url.searchParams.set('keyword', keywords);
            window.history.pushState({}, '', url.toString());

            this.doSearch(keywords.split(' '));
        });
    }
}

declare global {
    interface Window {
        searchConfig: SearchConfig;
        searchResultTitleTemplate: string;
    }
}

window.addEventListener('load', () => {
    new Search(window.searchConfig);
});