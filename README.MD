**str.grid** - ui-компонент, представляет собой таблицу для отображения данных. Может отображать данные в виде линейной диаграммы. 

[Демо](http://shaidulint.github.io/Day_22_Grid/index.html)

Пример использования:
```js
var grid = new StrGrid('DOMNodeID', {
    Columns: [{
        name: 'Дата',
        index: 'date',
        width: 100,
        chartAxis: true
    }, {
        name: 'Олег',
        index: 'prop1',
        chartData: true
    }, {
        name: 'Антон',
        index: 'prop2',
        chartData: true
    }, {
        name: 'Александр',
        index: 'prop3',
        chartData: true
    }],
    Data: data,
    InitPaginator: true
});
```
