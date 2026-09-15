# -*- coding: utf-8 -*-
"""Типограф сайта Datsiev Club.

Ставит неразрывные пробелы, чтобы предлог не оставался в конце строки,
а переносился вместе со словом: после коротких предлогов, союзов и частиц
(в, на, с, и, для, без…), перед тире и стрелкой, между числом и словом
(«4 лет», «3 700 ₽»), в «ул. Астраханская» и инициалах («Антон Б.»).
Фразу «Подберём за 2 минуты» не рвёт вовсе.

В HTML неразрывный пробел пишется как &nbsp; — так его видно при правке.
Трогает только текст и атрибуты data-title / data-sub / data-cta; теги,
ссылки, скрипты, стили и <head> остаются как были.
"""
import re
NB = ' '
CYR = 'А-Яа-яЁё'
SHORT = ('в|во|к|ко|с|со|у|о|об|обо|и|а|но|да|не|ни|на|за|по|до|из|изо|от|ото|'
         'для|без|при|над|под|про|или|как|что|чем|где|мы|вы|я')
WS = r'[ \t\r\n]+'
R_BACK  = re.compile(r'(?<=\S)' + WS + r'(же|ли|бы)(?![' + CYR + r'])')
R_FWD   = re.compile(r'(?<![' + CYR + r'A-Za-z0-9\-])(' + SHORT + r')' + WS + r'(?=[^\s<])', re.I)
R_FWD_END = re.compile(r'(?<![' + CYR + r'A-Za-z0-9\-])(' + SHORT + r')' + WS + r'$', re.I)
R_DASH  = re.compile(WS + r'([—–])(?=[ \t\r\n])')
R_ARROW = re.compile(WS + r'(→)')
R_NUMW  = re.compile(r'(?<![' + CYR + r'A-Za-z])(\d+)' + WS + r'(?=[' + CYR + r'₽%])')
R_NUMN  = re.compile(r'(\d)' + WS + r'(?=\d)')
R_NUM_END = re.compile(r'(?<![' + CYR + r'A-Za-z])(\d+)' + WS + r'$')
R_NO    = re.compile(r'№' + WS + r'(?=\d)')
R_ABBR  = re.compile(r'(?<![' + CYR + r'])(ул\.|г\.)' + WS)
R_INIT  = re.compile(r'([А-ЯЁ][а-яё]+)' + WS + r'(?=[А-ЯЁ]\.)')
PHRASES = ['Подберём за 2 минуты', 'Подберём секцию за 2 минуты', 'Подобрать за 2 минуты']

def typo(t, glue_tail=False):
    for ph in PHRASES:                      # фразы, которые не рвём вовсе
        t = re.sub(r'\s+'.join(map(re.escape, ph.split())), ph.replace(' ', NB), t)
    t = R_BACK.sub(lambda m: NB + m.group(1), t)
    t = R_FWD.sub(lambda m: m.group(1) + NB, t)
    t = R_DASH.sub(lambda m: NB + m.group(1), t)
    t = R_ARROW.sub(lambda m: NB + m.group(1), t)
    t = R_NUMN.sub(lambda m: m.group(1) + NB, t)
    t = R_NUMW.sub(lambda m: m.group(1) + NB, t)
    t = R_NO.sub('№' + NB, t)
    t = R_ABBR.sub(lambda m: m.group(1) + NB, t)
    t = R_INIT.sub(lambda m: m.group(1) + NB, t)
    if glue_tail:                           # предлог в конце куска, дальше идёт <b>, <a> и т.п.
        t = R_FWD_END.sub(lambda m: m.group(1) + NB, t)
        t = R_NUM_END.sub(lambda m: m.group(1) + NB, t)
    return t

TOK = re.compile(r'(<!--.*?-->|<script\b.*?</script>|<style\b.*?</style>|<head\b.*?</head>|<[^>]+>)', re.S | re.I)
INLINE_OPEN = re.compile(r'<(b|i|a|span|strong|em)\b[^>]*>$', re.I)
ATTR = re.compile(r'(\sdata-(?:title|sub|cta)=")([^"]*)(")')

def html(s):
    parts = TOK.split(s)
    for i in range(0, len(parts), 2):
        nxt = parts[i + 1] if i + 1 < len(parts) else ''
        parts[i] = typo(parts[i], glue_tail=bool(INLINE_OPEN.match(nxt)))
    for i in range(1, len(parts), 2):
        if parts[i].startswith('<') and not parts[i].startswith(('<!--', '<script', '<style', '<head')):
            parts[i] = ATTR.sub(lambda m: m.group(1) + typo(m.group(2)) + m.group(3), parts[i])
    out = ''.join(parts)
    # в разметке — видимой сущностью, чтобы при правке было понятно, что там стоит
    return out.replace(NB, '&nbsp;')


if __name__ == '__main__':
    # python3 tools/typograf.py index.html treneri.html …  — правит файлы на месте.
    # Повторный прогон ничего не ломает: уже склеенные места не трогаются.
    import sys, glob
    files = sys.argv[1:] or sorted(glob.glob('*.html'))
    for path in files:
        s = open(path, encoding='utf-8').read()
        out = html(s)
        if out != s:
            open(path, 'w', encoding='utf-8').write(out)
            print('обработан:', path)
