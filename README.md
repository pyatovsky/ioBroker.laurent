![Logo](admin/Laurent_Green.png)
# ioBroker Laurent Adapter
=========================

## English
[по русски](#Русский)

Plugin for control the ethernet-relay Laurent (http://www.kernelchip.ru/Laurent-2.php)

### List of supported devices
1. Laurent
1. Laurent-2 (MP-712)
1. Laurent-2G (MP-718)
1. Perhaps it will work with Laurent-112 (MP-716)

### Functions
Relays, Outlines and Inlines are supported now.
Some other functions can be added later if necessary.

### Information
Feedback is done by requesting a xml-file with statuses periodically.
Sending commands operates by http-request. Therefore, the security mode must be disabled in settings of Laurent.

The uptime is convenient for diagnosing that a connection is present.

The ability to select the components that will be used (relays, lines, etc.) is made for not to produce unnecessary objects, do not overcharge the interface and do not waste resources. But it is not important.

### Changelog
* 0.0.1 - Initial Revision
---
## Русский

Плагин для управления модулем Laurent (http://www.kernelchip.ru/Laurent-2.php)

### Список поддерживаемых устройств:
1. Laurent
1. Laurent-2 (MP-712)
1. Laurent-2G (MP-718)
1. Возможно, будет работать с Laurent-112 (MP-716)

### Функции
Сделана поддержка реле, выходных и входных линий.
Некоторые другие функции можно будет добавить позже при необходимости.

## Информация
Обратная связь осуществляется путем периодического запроса состояния (xml-файл).
Отсылка команд осуществляется путем http-запроса. Таким образом, режим безопасности в настройках Лорана должен быть отключен.

Время работы (uptime) удобно использовать для диагностики, что есть связь.

Возможность выбора компонентов, которые будут использоваться (реле, линии, и т.д.), сделана чтобы не плодить лишние объекты, не захламлять интерфейс и не тратить ресурсы. Но в целом это не принципиально.

### История:
* Версия 0.0.1 - Начальная версия
