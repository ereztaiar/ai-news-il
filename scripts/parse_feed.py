#!/usr/bin/env python3
"""Parse an RSS or Atom feed file into a JSON array of article objects.

Usage: parse_feed.py RAW_FEED_FILE > out.json

Stdlib only (xml.etree.ElementTree, html, json) — no pip install needed,
so this can run unattended from cron alongside fetch_news.sh's curl calls.
Using json.dumps also sidesteps hand-escaping entirely, which matters
because Hebrew text routinely contains literal `"` as abbreviation
punctuation (e.g. צה"ל, בג"ץ).
"""
import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit, urlunsplit

TAG_RE = re.compile(r'<[^>]+>')
WS_RE = re.compile(r'\s+')
IMG_SRC_RE = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']')

# Haaretz's RSS feed links thumbnails (~108x81) via width/height query params
# on their image CDN. The CDN honors arbitrary values and resizes on the fly
# (preserving aspect ratio when only width is given), so request a much
# larger image instead of using the feed's tiny default.
HAARETZ_IMG_HOST = 'img.haarets.co.il'
HAARETZ_IMG_WIDTH = 1200


def upgrade_haaretz_image(url: str) -> str:
    parts = urlsplit(url)
    if parts.netloc != HAARETZ_IMG_HOST:
        return url
    return urlunsplit(parts._replace(query=f'width={HAARETZ_IMG_WIDTH}'))


def local(tag: str) -> str:
    return tag.rsplit('}', 1)[-1]


def text_of(el) -> str:
    return (el.text or '').strip() if el is not None else ''


def clean_text(s: str) -> str:
    s = TAG_RE.sub(' ', s)
    s = html.unescape(s)
    return WS_RE.sub(' ', s).strip()


def find_image(entry, raw_description: str):
    for child in entry:
        tag = local(child.tag)
        if tag == 'enclosure':
            media_type = child.get('type', '')
            if not media_type or media_type.startswith('image/'):
                url = child.get('url')
                if url:
                    return upgrade_haaretz_image(url)
        elif tag in ('content', 'thumbnail'):  # media:content / media:thumbnail
            url = child.get('url')
            if url:
                return upgrade_haaretz_image(url)
    m = IMG_SRC_RE.search(raw_description)
    return upgrade_haaretz_image(m.group(1)) if m else None


def parse_rss_item(item):
    fields = {local(c.tag): c for c in item}
    description_raw = fields['description'].text or '' if 'description' in fields else ''
    out = {
        'title': clean_text(text_of(fields.get('title'))),
        'url': text_of(fields.get('link')),
        'published': text_of(fields.get('pubDate')) or text_of(fields.get('date')),
        'summary': clean_text(description_raw),
    }
    image = find_image(item, description_raw)
    if image:
        out['image'] = image
    return out


def parse_atom_entry(entry):
    fields = {}
    link = ''
    for c in entry:
        tag = local(c.tag)
        if tag == 'link':
            href = c.get('href')
            if href and (not link or c.get('rel') in (None, 'alternate')):
                link = href
        else:
            fields[tag] = c

    summary_el = fields.get('summary') or fields.get('content')
    summary_raw = summary_el.text or '' if summary_el is not None else ''
    out = {
        'title': clean_text(text_of(fields.get('title'))),
        'url': link,
        'published': text_of(fields.get('published')) or text_of(fields.get('updated')),
        'summary': clean_text(summary_raw),
    }
    image = find_image(entry, summary_raw)
    if image:
        out['image'] = image
    return out


def main():
    if len(sys.argv) != 2:
        print('usage: parse_feed.py RAW_FEED_FILE', file=sys.stderr)
        sys.exit(2)

    tree = ET.parse(sys.argv[1])
    root = tree.getroot()

    items = []
    if local(root.tag) == 'feed':  # Atom
        for entry in root:
            if local(entry.tag) == 'entry':
                items.append(parse_atom_entry(entry))
    else:  # RSS — <item> elements live under channel, but depth doesn't matter
        for el in root.iter():
            if local(el.tag) == 'item':
                items.append(parse_rss_item(el))

    items = [i for i in items if i['title'] and i['url']]
    print(json.dumps(items, ensure_ascii=False))


if __name__ == '__main__':
    main()
