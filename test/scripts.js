function ready() {

    var data = [];
    for(var i = 1; i < 62; i++ ) {
        var o = {};

        var month = Math.floor(i / 31);
        if (month === 0) {
            o.date = i + ".06";
        } else {
            o.date = ((i + 1) % 32 + 1) + ".07";
        }
        if (o.date.length === 4)
            o.date = "0" + o.date;

        o.prop1 = Math.floor(Math.random() * (65 - 45 + 1)) + 45;
        o.prop2 = Math.floor(Math.random() * (60 - 48 + 1)) + 48;
        o.prop3 = Math.floor(Math.random() * (52 - 33 + 1)) + 33;
        data.push(o);
    }

    var grid = StrGrid('grid', {
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
}

document.addEventListener('DOMContentLoaded', ready);