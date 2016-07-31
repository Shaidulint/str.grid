function StrGrid(DomID, Options) {
    /// <summary>Создает таблицу для вывода данных</summary>
    /// <param name="DomID" type="String">ID элемента - контейнера будущей таблицы</param>
    /// <param name="Options" type="Object">Различные параметры</param>

    //  privates
    var defaults = {
        InitPaginator: true,
        CountRow: [10, 30, 50],
        Data: [],
        ChartPaginator: false,
        Columns: [{name: "Name", index: "name" }]       //name, index, width, inChart
    }
    for(var key in defaults) {
        if (Options[key] == undefined) {
            Options[key] = defaults[key];
        }
    }
    var defaultColors = [ '#00C8E2', '#FF5D4F', '#BDD30F', '#FCA32B', '#04E0DE', '#FB68AF', '#0068AF' ];

    var chartInit = false;
    var nowShowGrid = true;
    var chart = null;

    var pageIndex = 0;
    var countRowsInPage = 10;

    // elements
    var commonContainer = null;
    var headContainer = null;
    var bodyContainer = null;
    var headTable = null;
    var bodyTable = null;
    var headColgroup = null;
    var bodyColgroup = null;
    var headContent = null;
    var bodyContent = null;

    var paginatorContainer = null;
    var paginatorControlPrevious = null;
    var paginatorControlNext = null;
    var paginatorControlCounter = null;
    var paginatorControlCountRow = null;

    var chartContainer = null;
    var chartContent = null;
    var chartGridToggler = null;

    //  functions

    /**
     * Первичная инициалиацзия элементов
     */
    var elementsPrimoryInitialize = function() {
        commonContainer = document.getElementById(DomID);
        commonContainer.className = 'str-grid';

        headContainer = document.createElement('div');
        headContainer.className = 'str-grid__head-container';
        bodyContainer = document.createElement('div');
        bodyContainer.className = 'str-grid__body-container';

        headTable = document.createElement('table');
        headTable.className = 'str-grid__head-table';
        bodyTable = document.createElement('table');
        bodyTable.className = 'str-grid__body-table';

        headColgroup = document.createElement('colgroup');
        bodyColgroup = document.createElement('colgroup');

        headContent = document.createElement('tbody');
        bodyContent = document.createElement('tbody');

        commonContainer.appendChild(headContainer);
        commonContainer.appendChild(bodyContainer);
        headContainer.appendChild(headTable);
        bodyContainer.appendChild(bodyTable);
        headTable.appendChild(headColgroup);
        headTable.appendChild(headContent);
        bodyTable.appendChild(bodyColgroup);
        bodyTable.appendChild(bodyContent);

        if (Options.InitPaginator)
            paginatorInitialize();
        
        if (canDrawChart())
            chartContainerInitialize();
    }
    //  Инициализация пагинатора
    var paginatorInitialize = function() {
        paginatorContainer = document.createElement('div');
        paginatorContainer.className = 'str-grid__paginator-container';

        paginatorControlPrevious = document.createElement('button');
        paginatorControlPrevious.className = 'str-grid__icon str-grid__paginator-previous';
        paginatorControlNext = document.createElement('button');
        paginatorControlNext.className = 'str-grid__icon str-grid__paginator-next';
        paginatorControlCounter = document.createElement('span');
        paginatorControlCounter.className = 'str-grid__paginator-counter';


        commonContainer.appendChild(paginatorContainer);
        paginatorContainer.appendChild(paginatorControlPrevious);
        paginatorContainer.appendChild(paginatorControlCounter);
        paginatorContainer.appendChild(paginatorControlNext);

        paginatorControlPrevious.addEventListener('click', function (evt) {
            changePagePrevious();
        });
        paginatorControlNext.addEventListener('click', function (evt) {
            changePageNext();
        });

        initSelectCountRow();
    }
    //  Инициализация контейнера диаграммы
    var chartContainerInitialize = function() {
        chartInit = true;

        chartContainer = document.createElement('div');
        chartContainer.className = "str-grid__chart-container";

        var chartContainerHeight = commonContainer.offsetHeight;
        if (paginatorContainer != null)
            chartContainerHeight -= paginatorContainer.offsetHeight;
        chartContainer.style.height = chartContainerHeight + "px";
        chartContainer.style.display = "none";

        chartContent = document.createElementNS('http://www.w3.org/2000/svg','svg');
        chartContent.setAttribute("class", "str-grid__chart-content");

        chartGridToggler = document.createElement("input");
        chartGridToggler.setAttribute('type', 'checkbox');
        chartGridToggler.className = "str-grid__chart-grid-toggler str-grid__icon";
        chartGridToggler.addEventListener('change', function(evt) {
            chartGridToggle();
        })

        chartContainer.appendChild(chartContent);
        commonContainer.insertBefore(chartContainer, paginatorContainer);
        commonContainer.appendChild(chartGridToggler);

        chart = new LinearDiagram(chartContent, {});
    }

    //  Инициализация заголовков
    var headInitialize = function() {
        var htmlTableColgroups = getHTMLTableColumns(Options.Columns);
        headContent.innerHTML = getHTMLTableHead(Options.Columns);
        headColgroup.innerHTML = htmlTableColgroups;
        bodyColgroup.innerHTML = htmlTableColgroups;
        
        //  вычисляем высоту боди-контейнера
        var bodyContainerHeight = commonContainer.offsetHeight - headContainer.offsetHeight;
        if (paginatorContainer != null)
            bodyContainerHeight -= paginatorContainer.offsetHeight;
        bodyContainer.style.height = bodyContainerHeight + "px";

    }

    //  Обновить данные в таблице
    var gridDataInitialize = function (IndexPage) {
        var dataForVisualize = null;
        if (Options.InitPaginator)
            dataForVisualize = getDataForVisualize(IndexPage * countRowsInPage, countRowsInPage);
        else
            dataForVisualize = getDataForVisualize();

        var rows = "";
        for(var i = 0; i < dataForVisualize.length; i++) {
            rows += getHTMLTableRow(dataForVisualize[i], Options.Columns);
        }
        bodyContent.innerHTML = rows;

        //  Сдвигаем шапку влево, если есть скролл у тела
        if (headTable.offsetWidth !== bodyTable.offsetWidth)
            headTable.style.width = bodyTable.offsetWidth + "px";

        if (chart !== null)
            chartDataInitialize(dataForVisualize);
    }

    var chartReDraw = function() {
        var dataForVisualize = null;
        if (Options.InitPaginator)
            dataForVisualize = getDataForVisualize(pageIndex * countRowsInPage, countRowsInPage);
        else
            dataForVisualize = getDataForVisualize();
        chartDataInitialize(dataForVisualize);
    }

    var chartDataInitialize = function(data) {
        var dataForChart = [];
        var axisForChart = [];
        var axisIndex = "";
        var defaultColorIndex = 0;

        for(var i = 0, count = Options.Columns.length; i < count; i++) {
            if (Options.Columns[i].chartData) {
                var lineColor = '#000';
                if (Options.Columns[i].chartColor)
                    lineColor = Options.Columns[i].chartColor;
                else {
                    lineColor = defaultColors[defaultColorIndex++];
                }
                dataForChart.push({
                    index: Options.Columns[i].index,
                    Title: Options.Columns[i].name,
                    Color: lineColor,
                    DataSet: []
                });
            } else if (Options.Columns[i].chartAxis) {
                axisIndex = Options.Columns[i].index;
            }
        }

        for(var i = 0, countRows = data.length; i < countRows; i++) {
            axisForChart.push(data[i][axisIndex]);
            for(var col = 0, countCols = dataForChart.length; col < countCols; col++) {
                var dataItem = data[i][dataForChart[col].index];
                if (dataItem !== undefined) {
                    dataForChart[col].DataSet.push(dataItem);
                } else {
                    dataForChart[col].DataSet.push(null);
                }
            }
        }
        
        chart.Draw(axisForChart, dataForChart);
    }
    
    //  Получить данные для отображения
    var getDataForVisualize = function(IndexStart, Count) {
        if (IndexStart == null) {
            IndexStart = 0;
            Count = Options.Data.length;
        }
        return Options.Data.slice(IndexStart, IndexStart + Count);
    }

    //  Возвращает максимальное кол-во страниц
    var getCountPages = function() {
        return Math.ceil(Options.Data.length / countRowsInPage);
    }

    //  Обновляет номер страницы в пагинаторе
    var updatePageCounterText = function() {
        if (Options.InitPaginator)
            paginatorControlCounter.innerText = (pageIndex + 1) + " / " + getCountPages();
    }

    //  Создает селектбокс для выбора кол-ва страниц
    var initSelectCountRow = function() {
        var select = document.createElement('select');
        select.className = 'str-grid__paginator-select-count-row';
        for(var i in Options.CountRow) {
            var option = document.createElement('option');
            option.value = Options.CountRow[i];
            option.innerText = Options.CountRow[i];
            select.appendChild(option);
        }

        select.addEventListener('change', function(evt) {
            changeCountRow(parseInt(select.value));
        });

        paginatorControlCountRow = select;
        paginatorContainer.appendChild(select);
    }

    //  Смена кол-ва отображаемых строк
    var changeCountRow = function(CountRow) {
        countRowsInPage = CountRow;
        if (pageIndex >= getCountPages()) {
            pageIndex = getCountPages() - 1;
        }
        gridDataInitialize(pageIndex);
        updatePageCounterText();
    }
    
    //  Переход к пред. странице
    var changePagePrevious = function() {
        if (pageIndex > 0) {
            pageIndex--;
            gridDataInitialize(pageIndex);
            updatePageCounterText();
        }
    }

    //  Переход к след. странице
    var changePageNext = function() {
        if (pageIndex + 1 < getCountPages()) {
            pageIndex++;
            gridDataInitialize(pageIndex);
            updatePageCounterText();
        }
    }

    //  Возвращает HTML-код для colgroup
    var getHTMLTableColumns = function () {
        var countColumnsWithoutWidth = 0;
        for (var i in Options.Columns) {
            if (!Options.Columns[i].Width) {
                countColumnsWithoutWidth++;
            }
        }
        var defaultWidth = commonContainer.offsetWidth / countColumnsWithoutWidth;
        if (defaultWidth < 10)
            defaultWidth = 10;
        var result = "";
        for (var i in Options.Columns) {
            result += "<col width=\"" + ((Options.Columns[i].width) ? Options.Columns[i].width : defaultWidth) + "\" />";
        }
        return result;
    }

    var canDrawChart = function() {
        for( var i in Options.Columns) {
            if (Options.Columns[i].chartData)
                return true;
        }
        return false;
    }

    var chartGridToggle = function() {
        if (nowShowGrid) {
            headContainer.style.display = "none";
            bodyContainer.style.display = "none";
            chartContainer.style.display = "block";
            nowShowGrid = false;
            chartReDraw();
        } else {
            headContainer.style.display = "";
            bodyContainer.style.display = "";

            chartContainer.style.display = "none";
            nowShowGrid = true;
        }
    }

    //  Возвращает HTML-код для таблицы (Шапка)
    function getHTMLTableHead(ArrColumns) {
        var result = "<tr class=\"str-grid__head-row\">";
        for (var i in ArrColumns) {
            result += "<td class=\"str-grid__head-cell\">" + ArrColumns[i].name + "</td>";
        }
        result += "</tr>";
        return result;
    }
    //  Возвращает HTML-код для таблицы (Данные)
    function getHTMLTableRow(DataObject, ArrColumns) {
        var result = "<tr class=\"str-grid__body-row\">";
        for (var i in ArrColumns) {
            var value = DataObject[ArrColumns[i].index];
            result += "<td class=\"str-grid__body-cell\">" + ((value != undefined) ? value : '') + "</td>";
        }
        result += "</tr>";
        return result;
    }

    elementsPrimoryInitialize();
    headInitialize();
    gridDataInitialize(0);
    updatePageCounterText();
}