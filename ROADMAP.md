# Roadmap to re-write

## Такие планы по переносу кода на ES6

1. Переносим саму библиотеку на ES6 + core.js (пытаемся отказаться от lodash) - пока импортим ВСЕ, в глобаль.
1. Убеждаемся, что проходит node тесты
1. Проверяем, нельзя ли использовать ES6 фичи (типа Map/WeakMap, итераторов и прочего)
1. Добавляем линтер (возможно https://github.com/feross/standard)
1. Смотим что на самом деле использовалось из core и делаем импорт ТОЛЬКО этих частей
1. Делаем сборку для фронта
1. Убеждаемся, что проходит все browser тесты
1. Правим документацию
1. Правим тесты на ES6
1. Правим инфораструктруру на ES6
1. Переводим клиентскую часть на webpack