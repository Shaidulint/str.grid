/*
    TO DO:
    1. Селектбоксы
    2. События нажатия на строку, нажатия на ячейку, нажатия ПКМ на строку, нажатия ПКМ на ячейку
    3. События выбора селектбокса
    4. События всплывающего окна на графике
    5. Параметр для отключения всплывающего окна на графике
    6. Корректная отрисовка на графике одной точки
    7. Корректная отрисовка всплывающего окна на точке пересечения графиков (подсказка)
    8. Сообщение о отсутсвиии данных для отображения
    9. Сообщения о неправильных (или об их отсутсвии) входных данных
*/
(function(global) {

    /**
     * Расширяет target методами и функциями из source
     * @param {Object} source Источник свойств
     * @param {Object} target Предмет действия
     * @return возвращает обновленный target
     */
    var extend = function(source, target) {
        for (var key in source) {
            if (target[key] == undefined)
                target[key] = source[key];
        }
        return target;
    }

    /**
     * Создает элемент
     * @param {String} tagName имя тега который создаем
     * @param {String} [className] имя класса
     * @param {Element} [parent] элемент-родитель
     * @return возвращает новый элемент
     */
    var createEl = function(tagName, className, parent) {
        var element = global.document.createElement(tagName);
        if (className != undefined)
            element.className = className;
        if (parent != undefined)
            parent.appendChild(element);
        return element;
    }

    /**
     * Возвращает HTML для шапки таблицы
     * @param {Array} columns - описание столбцов
     * @return HTML-код строки шапки таблицы
     */
    var getHTMLTableHead = function(columns) {
        var result = "<tr class=\"str-grid__head-row\">";
        for (var i in columns) {
            result += "<td class=\"str-grid__head-cell\">" + columns[i].name + "</td>";
        }
        result += "</tr>";
        return result;
    }

    /**
     * Возвращает HTML-код для строки с данными в таблице
     * @param {Object} dataItem - данные для строки
     * @param {Array} columns - описание столбцов
     * @return HTML-код строки таблицы
     */
    var getHTMLTableRow = function(dataItem, columns) {
        var result = "<tr class=\"str-grid__body-row\">";
        for (var i in columns) {
            var value = dataItem[columns[i].index];
            result += "<td class=\"str-grid__body-cell\">" + ((value != undefined) ? value : '') + "</td>";
        }
        result += "</tr>";
        return result;
    }

    /**
     * Создает таблицу для вывода данных
     * @param {String} domID ID элемента - контейнера будущей таблицы
     * @param {Object} parameters пользовательские параметры
     */
    global.StrGrid = function(domID, parameters) {

        //  privates
        var defaultoptions = {
            /**
             * наличие пагинатора
             */
            initPaginator: true,
            /**
             * возможные варианты кол-ва отображаемых строк
             */
            countRow: [10, 30, 50],
            /**
             * данные
             */
            data: [],
            /**
             * Отрисовка пагинатора
             */
            chartPaginator: false,
            /**
             * Параметры столбцов
             */
            columns: [{name: "Name", index: "name" }]       //name, index, width, inChart
        }
        var options = extend(defaultoptions, parameters),
            defaultColors = [ '#00C8E2', '#FF5D4F', '#BDD30F', '#FCA32B', '#04E0DE', '#FB68AF', '#0068AF' ];

        var chartInit = false,
            nowShowGrid = true,
            chart = null,
            pageIndex = 0,
            countRowsInPage = 10;

        // elements
        var commonContainer = null,
            headContainer = null,
            bodyContainer = null,
            headTable = null,
            bodyTable = null,
            headColgroup = null,
            bodyColgroup = null,
            headContent = null,
            bodyContent = null,
            paginatorContainer = null,
            paginatorControlPrevious = null,
            paginatorControlNext = null,
            paginatorControlCounter = null,
            paginatorControlCountRow = null,
            chartContainer = null,
            chartContent = null,
            chartGridToggler = null;

        //  functions

        /**
         * Создание основых DOM-элементов
         */
        var commonElementsCreate = function() {

            commonContainer = global.document.getElementById(domID);
            commonContainer.className = 'str-grid';

            headContainer = createEl('div', 'str-grid__head-container', commonContainer);
            bodyContainer = createEl('div', 'str-grid__body-container', commonContainer);

            headTable = createEl('table', 'str-grid__head-table', headContainer);
            bodyTable = createEl('table', 'str-grid__body-table', bodyContainer);

            headColgroup = createEl('colgroup', null, headTable);
            bodyColgroup = createEl('colgroup', null, bodyTable);

            headContent = createEl('tbody', null, headTable);
            bodyContent = createEl('tbody', null, bodyTable);

            if (options.initPaginator)
                paginatorElementsCreate();
            
            if (canDrawChart())
                chartElementsCreate();
        }

        /**
         *  Создание DOM-элементов для пагинатора
         **/  
        var paginatorElementsCreate = function() {
            paginatorContainer = createEl('div', 'str-grid__paginator-container', commonContainer);

            paginatorControlPrevious = createEl('button', 'str-grid__icon str-grid__paginator-previous', paginatorContainer);
            paginatorControlCounter = createEl('span', 'str-grid__paginator-counter', paginatorContainer);
            paginatorControlNext = createEl('button', 'str-grid__icon str-grid__paginator-next', paginatorContainer);

            paginatorControlPrevious.addEventListener('click', changePagePreviousEvent);
            paginatorControlNext.addEventListener('click', changePageNextEvent);

            initSelectCountRow();
        }

        /**
         * Создание DOM-элементов для диаграммы
         * Инициализация диаграммы
         */
        var chartElementsCreate = function() {
            chartInit = true;

            chartContainer = createEl('div', 'str-grid__chart-container', null);

            var chartContainerHeight = commonContainer.offsetHeight;
            if (paginatorContainer != null)
                chartContainerHeight -= paginatorContainer.offsetHeight;
            chartContainer.style.height = chartContainerHeight + "px";
            chartContainer.style.display = "none";
            commonContainer.insertBefore(chartContainer, paginatorContainer);

            chartContent = document.createElementNS('http://www.w3.org/2000/svg','svg');
            chartContent.setAttribute("class", "str-grid__chart-content");
            chartContainer.appendChild(chartContent);

            

            chartGridToggler = document.createElement("input");
            chartGridToggler.setAttribute('id', domID + '_chartToggler');
            chartGridToggler.setAttribute('type', 'checkbox');
            chartGridToggler.className = "str-grid__chart-grid-toggler";
            chartGridToggler.addEventListener('change', function(evt) {
                chartGridToggle();
            })
            commonContainer.appendChild(chartGridToggler);

            var togglerLabel = createEl('label', 'str-grid__chart-grid-toggler-label', commonContainer);
            togglerLabel.htmlFor = domID + '_chartToggler';

            chart = new global.StrGrid.LinearDiagram(chartContent, {});
        }

        /**
         *  Создание шапки таблицы
         */ 
        var headTableCreate = function() {
            var htmlTableColgroups = getHTMLTableColumns(options.columns);
            headContent.innerHTML = getHTMLTableHead(options.columns);
            headColgroup.innerHTML = htmlTableColgroups;
            bodyColgroup.innerHTML = htmlTableColgroups;
            
            //  вычисляем высоту боди-контейнера
            var bodyContainerHeight = commonContainer.offsetHeight - headContainer.offsetHeight;
            if (paginatorContainer != null)
                bodyContainerHeight -= paginatorContainer.offsetHeight;
            bodyContainer.style.height = bodyContainerHeight + "px";
        }

        /**
         * Обновить данные в таблице
         */
        var gridDataInitialize = function (indexPage) {
            var dataForVisualize = null;
            if (options.initPaginator)
                dataForVisualize = getDataForVisualize(indexPage * countRowsInPage, countRowsInPage);
            else
                dataForVisualize = getDataForVisualize();

            var rows = "";
            for(var i = 0; i < dataForVisualize.length; i++) {
                rows += getHTMLTableRow(dataForVisualize[i], options.columns);
            }
            bodyContent.innerHTML = rows;

            //  Сдвигаем шапку влево, если есть скролл у тела
            if (headTable.offsetWidth !== bodyTable.offsetWidth)
                headTable.style.width = bodyTable.offsetWidth + "px";

            if (chart !== null)
                chartDataInitialize(dataForVisualize);
        }

        /**
         * Перерисовка диаграммы
         */
        var chartReDraw = function() {
            var dataForVisualize = null;
            if (options.initPaginator)
                dataForVisualize = getDataForVisualize(pageIndex * countRowsInPage, countRowsInPage);
            else
                dataForVisualize = getDataForVisualize();
            chartDataInitialize(dataForVisualize);
        }

        /**
         * Генерация данных для диаграммы и их отрисовка
         */
        var chartDataInitialize = function(data) {
            var dataForChart = [];
            var axisForChart = [];
            var axisIndex = "";
            var defaultColorIndex = 0;

            for(var i = 0, count = options.columns.length; i < count; i++) {
                if (options.columns[i].chartData) {
                    var lineColor = '#000';
                    if (options.columns[i].chartColor)
                        lineColor = options.columns[i].chartColor;
                    else {
                        lineColor = defaultColors[defaultColorIndex++];
                    }
                    dataForChart.push({
                        index: options.columns[i].index,
                        Title: options.columns[i].name,
                        Color: lineColor,
                        DataSet: []
                    });
                } else if (options.columns[i].chartAxis) {
                    axisIndex = options.columns[i].index;
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
                Count = options.data.length;
            }
            return options.data.slice(IndexStart, IndexStart + Count);
        }

        //  Возвращает максимальное кол-во страниц
        var getCountPages = function() {
            return Math.ceil(options.data.length / countRowsInPage);
        }

        //  Обновляет номер страницы в пагинаторе
        var updatePageCounterText = function() {
            if (options.initPaginator)
                paginatorControlCounter.innerText = (pageIndex + 1) + " / " + getCountPages();
        }

        //  Создает селектбокс для выбора кол-ва страниц
        var initSelectCountRow = function() {
            var select = document.createElement('select');
            select.className = 'str-grid__paginator-select-count-row';
            for(var i in options.countRow) {
                var optionEl = document.createElement('option');
                optionEl.value = options.countRow[i];
                optionEl.innerText = options.countRow[i];
                select.appendChild(optionEl);
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
        var changePagePreviousEvent = function() {
            if (pageIndex > 0) {
                pageIndex--;
                gridDataInitialize(pageIndex);
                updatePageCounterText();
            }
        }

        //  Переход к след. странице
        var changePageNextEvent = function() {
            if (pageIndex + 1 < getCountPages()) {
                pageIndex++;
                gridDataInitialize(pageIndex);
                updatePageCounterText();
            }
        }

        //  Возвращает HTML-код для colgroup
        var getHTMLTableColumns = function () {
            var countColumnsWithoutWidth = 0;
            for (var i in options.columns) {
                if (!options.columns[i].Width) {
                    countColumnsWithoutWidth++;
                }
            }
            var defaultWidth = commonContainer.offsetWidth / countColumnsWithoutWidth;
            if (defaultWidth < 10)
                defaultWidth = 10;
            var result = "";
            for (var i in options.columns) {
                result += "<col width=\"" + ((options.columns[i].width) ? options.columns[i].width : defaultWidth) + "\" />";
            }
            return result;
        }

        var canDrawChart = function() {
            return options.columns.some(function(col) { return col.chartData;});
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

        commonElementsCreate();
        headTableCreate();
        gridDataInitialize(0);
        updatePageCounterText();
    }

})(window);