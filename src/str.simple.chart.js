(function(local) {

    //  Вычисляет горизонтальные оси
    function CalculateYAxis(Data) {
        function GetMultipleByDelta(Delta) {
            var localMultiple = 5;
            if (Delta <= 10)
                localMultiple = 5
            else if (Delta <= 15)
                localMultiple = 10;
            else if (Delta <= 20)
                localMultiple = 15;
            else if (Delta <= 50)
                localMultiple = 25;
            else if (Delta <= 100)
                localMultiple = 50;
            else if (Delta <= 300)
                localMultiple = 100;
            else if (Delta <= 800)
                localMultiple = 400;
            else if (Delta <= 1000)
                localMultiple = 500;
            else
                localMultiple = 1000;

            return CalculateMultiple(Math.floor(Delta / 3), localMultiple, true);
        }
        var min = Math.min.apply(null, Data);
        var max = Math.max.apply(null, Data);
        var delta = max - min;
        var multiple = GetMultipleByDelta(delta);
        var axisMin = CalculateMultiple(min, multiple, false);
        var axisMax = CalculateMultiple(max, multiple, true);
        var axisMinMaxDelta = axisMax - axisMin;
        var countLines = 1;
        if (axisMinMaxDelta % 2 == 0)
            countLines = 2;
        else if (axisMinMaxDelta % 3 == 0)
            countLines = 3;
        var axis = [axisMin];
        for (var i = 1; i < countLines; i++) {
            axis.push(axisMin + i * axisMinMaxDelta / countLines);
        }
        axis.push(axisMax);
        return axis;
    }
    //  Найти Близжайшее к Start кратное Multiple число 
    function CalculateMultiple(Start, Multiple, Increase) {
        var increase = (Increase) ? 1 : -1;
        while(true) {
            if (Start % Multiple === 0)
                return Start;
            else
                Start += increase;
        }
    }

    function CalculateXAxis(AxisCount, Width) {
        if ((AxisCount < 1) || (Width < 0))
            return { divider: 1, offset: 0 };
        var minimalOffsetBetweenAxis = 50;
        var currentOffset = Width / (AxisCount - 1);
        var divider = 1;
        while(currentOffset < minimalOffsetBetweenAxis)
        {
            divider *= 2;
            currentOffset = Width / ((AxisCount - 1) / divider);
        }
        return { divider: divider, offset: currentOffset };
    }

    function TransformCoordinate(Width, Height, CountX, MinValues, MaxValues, Data) {
        var result = [];
        var heightOnePoint = Height / (MaxValues - MinValues);
        for (var i = 0; i < Data.length; i++) {
            if (Data[i] != null) {
                var x = Width / (CountX - 1) * i;
                var y = (MaxValues - Data[i]) * heightOnePoint;
                result.push({x: x, y: y});
            } else {
                result.push(null);
            }
        }
        return result;
    }

    GenerateSvgPathInfobox = function(XTarget, YTarget, Width, Height, ArrowBottom) {
        var arrowHalfWidth = 10;
        var arrowHeight = 15; 
        var radius = 5;
        var X1 = XTarget - Width/2;
        var Y1 = 0;
        var X2 = XTarget + Width/2;
        var Y2 = 0;
        if (ArrowBottom) {
            Y1 = YTarget - (5 + arrowHeight + Height);
            Y2 = YTarget - (5 + arrowHeight);
        } else {
            Y1 = YTarget + (5 + arrowHeight);
            Y2 = YTarget + (5 + arrowHeight + Height);
        }
        var str = "M" + (X1 + radius) + "," + Y1;
        if (!ArrowBottom) {
            str += " L" + (XTarget - arrowHalfWidth) + "," + Y1;
            str += " L" + XTarget + "," + (Y1 - arrowHeight);
            str += " L" + (XTarget + arrowHalfWidth) + "," + Y1; 
        }
        str += " L" + (X2 - radius) + "," + Y1;
        str += " A" + radius + " " + radius + ", 0, 0, 1," + X2 + " " + (Y1 + radius);
        str += " L" + X2 + "," + (Y2 - radius);
        str += " A" + radius + " " + radius + ", 0, 0, 1," + (X2 - radius) + " " + Y2;
        if (ArrowBottom) {
            str += " L" + (XTarget + arrowHalfWidth) + "," + Y2; 
            str += " L" + XTarget + "," + (Y2 + arrowHeight);
            str += " L" + (XTarget - arrowHalfWidth) + "," + Y2;
        }
        str += " L" + (X1 + radius) + "," + Y2;
        str += " A" + radius + " " + radius + ", 0, 0, 1," + X1 + " " + (Y2 - radius);
        str += " L" + X1 + "," + (Y1 + radius);
        str += " A" + radius + " " + radius + ", 0, 0, 1," + (X1 + radius) + " " + Y1;
        str += " Z";
        return str;
    }

    local.LinearDiagram = function(SvgDomElement, Parameters) {
        //  options.Data = [{ Title(Заголовок), Color(Цвет), DataSet(Набор данных) }]
        //  options.Axis - массив отбивок по горизонтале
        var graphic = new local.SvgGraphic(SvgDomElement);
        var mouseover = false;
        var drawedPoints = [];
        var mouseSelectData = null
        var diagramZone = null;
        var allData = [];
        var axisHorizontal = null;
        var verticalAxisOffset = null;
        var options = {
            Data: [],
            Axis: []
        };
        for(var key in Parameters) {
            options[key] = Parameters[key];
        }
        

        var colors = {
            clear: "transparent",
            service: "#A9A9A9",
            infoboxfill: "#464646",
            infoboxtext: "#fff"
        }

        this.Draw = function(Axis, Data) {

            allData = [];
            for(var d in Data) {
                allData = allData.concat(Data[d].DataSet);
            }
            axisHorizontal = CalculateYAxis(allData);

            options.Axis = Axis;
            options.Data = Data;
            redraw();
        }

        var updateDiagramZone = function() {
            diagramZone = {
                top: 50,
                bottom: graphic.paper.getBoundingClientRect().height - 50,
                left: 50,
                right: graphic.paper.getBoundingClientRect().width - 30,
                width: graphic.paper.getBoundingClientRect().width - 30 - 50,
                height: graphic.paper.getBoundingClientRect().height - 50 - 50
            };

            verticalAxisOffset = CalculateXAxis(options.Axis.length || 0, diagramZone.width);
        };
        updateDiagramZone();





        //  группы

        var groupLegends = new local.SvgGroup(graphic);

        var groupAxis = new local.SvgGroup(graphic);
        var hAncillaryLines = new local.SvgGroup(graphic);
        var hAncillaryLinesLabels = new local.SvgGroup(graphic);
        var vAncillaryLines = new local.SvgGroup(graphic);
        var vAncillaryLinesLabels = new local.SvgGroup(graphic);
        groupAxis.Add(hAncillaryLines);
        groupAxis.Add(hAncillaryLinesLabels);
        groupAxis.Add(vAncillaryLines);
        groupAxis.Add(vAncillaryLinesLabels);

        var groupGraphs = new local.SvgGroup(graphic);
        var graphLines = new local.SvgGroup(graphic);
        var graphPoints = new local.SvgGroup(graphic);
        groupGraphs.Add(graphLines);
        groupGraphs.Add(graphPoints);

        /**
         * Перерисовывает данные
         */
        var draw = function() {
            drawLegend();
            drawAxis();
            drawGraph();
        }

        var redraw = function() {
            groupLegends.Clear();
            hAncillaryLines.Clear();
            hAncillaryLinesLabels.Clear();
            vAncillaryLines.Clear();
            vAncillaryLinesLabels.Clear();
            graphLines.Clear();
            graphPoints.Clear();
            updateDiagramZone();
            draw();
        }


        /**
         * Отрисовка легенды
         */
        var drawLegend = function() {

            for (var i = options.Data.length - 1, r = 0; i >= 0; i--, r++) {
                var x = diagramZone.right - 30 - r * 60;
                var label = new local.SvgText(graphic, x, diagramZone.top - 20, options.Data[i].Title);
                label.SetBold(true);
                label.SetFill(colors.service);
                label.Centerize(x, diagramZone.top - 20);

                var labelCoords =  label.Element.getBoundingClientRect();
                var pathString = "M" + (x - labelCoords.width/2) + "," + (diagramZone.top - 12) + " L" + (x + labelCoords.width/2) + "," + (diagramZone.top - 12);
                var box = new local.SvgPath(graphic, pathString);
                box.SetStroke(4, options.Data[i].Color);
                groupLegends.Add(label);
                groupLegends.Add(box);
            }
        }

        /**
         * Отрисовка гор. и верт. основных и вспомогательный осей 
         */
        var drawAxis = function() {
            //  горизонтальная ось
            var line = new local.SvgPath(graphic, local.SvgPath.GeneratePolyline([{x: diagramZone.left, y: diagramZone.bottom }, {x: diagramZone.right, y: diagramZone.bottom }]));
            line.SetFill(colors.clear);
            line.SetStroke(1, colors.service);
            hAncillaryLines.Add(line);

            //  гориз. вспомонательные линии
            for (var i = 1, count = axisHorizontal.length; i < count; i++) {
                var y = diagramZone.bottom - (diagramZone.height / (axisHorizontal.length - 1)) * i;
                var dottedLine = new local.SvgPath(graphic, local.SvgPath.GeneratePolyline([{x: diagramZone.left, y: y}, {x: diagramZone.right, y: y}]));
                dottedLine.SetFill(colors.clear);
                dottedLine.SetStroke(1, colors.service);
                dottedLine.Element.setAttribute('stroke-dasharray', "5, 5");
                hAncillaryLines.Add(dottedLine);

                var lineLabel = new local.SvgText(graphic, diagramZone.left, y, axisHorizontal[i]);
                lineLabel.Centerize(diagramZone.left - 15, y);
                lineLabel.SetFill(colors.service);
                hAncillaryLinesLabels.Add(lineLabel);
            }
            //  верт. вспомогательные линии
            for (var i = 0, count = options.Axis.length; i < count; i += verticalAxisOffset.divider) {
                var x = diagramZone.left + (diagramZone.width / (options.Axis.length - 1)) * i;
                if ((i > 0) && (i < options.Axis.length - 1)) {
                    var verticalLine = new local.SvgPath(graphic, local.SvgPath.GeneratePolyline([{x: x, y: diagramZone.top}, {x: x, y: diagramZone.bottom + 10 } ]));
                    verticalLine.SetFill(colors.clear);
                    verticalLine.SetStroke(1, colors.service);
                    vAncillaryLines.Add(verticalLine);
                }

                var lineLabel = new local.SvgText(graphic, x, diagramZone.bottom, options.Axis[i]);
                lineLabel.Centerize(x, diagramZone.bottom + 20);
                lineLabel.SetFill(colors.service);
                vAncillaryLinesLabels.Add(lineLabel);
            }
        }

        /**
         * Отрисовка линий графиков
         */
        var drawGraph = function() {
            //  Расчет точек графиков и построение линий графиков
            for (var i = 0, count = options.Data.length; i < count; i++) {
                var points = TransformCoordinate(diagramZone.width, diagramZone.height, options.Axis.length, axisHorizontal[0], axisHorizontal[axisHorizontal.length - 1], options.Data[i].DataSet);
                for(var p = 0; p < points.length; p++ ) {
                    if (points[p] != null) {
                        points[p].x += diagramZone.left;
                        points[p].y += diagramZone.top;
                    }
                }
                options.Data[i].Points = points;

                var line = new local.SvgPath(graphic, local.SvgPath.GeneratePolyline(options.Data[i].Points));
                line.SetFill(colors.clear);
                line.SetStroke(3, options.Data[i].Color);
                graphLines.Add(line);
            }
            //  Построение точек графиков
            for (var i = 0, count = options.Data.length; i < count; i++) {
                for (var p = 0; p < options.Data[i].Points.length; p++ ) {
                    var point = options.Data[i].Points[p];
                    var onAxis = (p % verticalAxisOffset.divider === 0) ? true : false;
                    if (point != null) {
                        var circle = new local.SvgCircle(graphic, point.x, point.y, 3);
                        circle.SetFill(options.Data[i].Color);
                        if (onAxis) {
                            circle.SetRadius(5);
                            circle.SetStroke(2, "#FFF");
                        }
                        graphPoints.Add(circle);
                    }
                }
            }
        }

        var infoBox = new local.SvgInfoBox(graphic, 100, 50, colors.infoboxfill, colors.infoboxtext);

        graphic.paper.addEventListener('mouseover', function(evt) {
            mouseover = true;
        });

        graphic.paper.addEventListener('mouseout', function(evt) {
            mouseover = false;
        });

        graphic.paper.addEventListener('wheel', function(evt) {
            if (evt.deltaY > 0) {
                infoBox.NextData();
            } else if (evt.deltaY < 0) {
                infoBox.PreviousData();
            }
        })
        

        graphic.paper.addEventListener('mousemove', function(evt) {
            if ((mouseover) && (options.Data) && (options.Data.length > 0)) {
                var nearestObject = CalculateMouseNearestPoint(evt.offsetX, evt.offsetY);
                if (nearestObject.points.length) {
                    var point = nearestObject.points[0].coordinate;
                    mouseSelectData = nearestObject;
                    var arrowBottom = (point.y < 100) ? false : true;

                    var dataForInfobox = [];
                    for(var i in nearestObject.points) {
                        dataForInfobox.push({
                            title: nearestObject.points[i].data.Title,
                            text: nearestObject.points[i].data.DataSet[nearestObject.points[0].index],
                            color: nearestObject.points[i].data.Color
                        })
                    }

                    infoBox.Show(point.x, point.y, dataForInfobox, arrowBottom);

                } else {
                    mouseSelectData = null;
                    infoBox.Hide();
                }
            }
        });

        window.addEventListener('resize', function(evt) {
            redraw();
        });

        //  Вычислить близжайшие точки у указателю мыши
        function CalculateMouseNearestPoint(MouseX, MouseY) {
            var nearest = {};
            nearest.distance2 = 2500;
            nearest.points = [];
            for (var i = 0; i < options.Data.length; i++) {
                for (var p = 0; p < options.Data[i].Points.length; p++) {
                    var point = options.Data[i].Points[p];
                    var distance2 = Math.pow(point.x - MouseX, 2) + Math.pow(point.y - MouseY, 2);
                    if (distance2 <= nearest.distance2) {
                        if (distance2 < nearest.distance2) {
                            nearest.distance2 = distance2;
                            nearest.points = [{ data: options.Data[i], index: p, coordinate: point }];
                        } else {
                            nearest.points.push({ data: options.Data[i], index: p, coordinate: point });
                        }
                    }
                }
            }
            return nearest;
        }



        //draw();
    }

    local.SvgInfoBox = function(graphic, width, height, backgroundColor, textColor) {
        var groupSvg =null;
        var containerSvg = null;
        var titleSvg = null;
        var textSvg = null;
        var gradientSvg = null;
        
        var data = [];
        var currentIndexData = 0;

        var initialize = function() {

            gradientSvg = new local.SvgRadialGradient(graphic, [
                { color: "#fff" },
                { color: backgroundColor }
            ]);

            groupSvg = new local.SvgGroup(graphic);

            containerSvg = new local.SvgPath(graphic, "M0,0 L0,0");
            gradientSvg.FillTo(containerSvg.Element);

            titleSvg = new local.SvgText(graphic, 0, 0, "");
            titleSvg.SetFill(textColor);
            titleSvg.SetFontSize("11pt");
            titleSvg.SetBold(true);

            textSvg = new local.SvgText(graphic, 0, 0, "");
            textSvg.SetFill(textColor);
            textSvg.SetFontSize("10pt");

            groupSvg.Add(containerSvg);
            groupSvg.Add(titleSvg);
            groupSvg.Add(textSvg);
            
            groupSvg.Hide();
            //containerSvg.Hide();
            //titleSvg.Hide();
            //textSvg.Hide();
        }

        this.Show = function(X, Y, Data, DirectedDown) {
            data = Data;
            containerSvg.SetPath(GenerateSvgPathInfobox(X, Y, width, height, DirectedDown));

            if (DirectedDown) {
                gradientSvg.SetPosition("50%", "100%", "50%", "100%", "50%");
            } else {
                gradientSvg.SetPosition("50%", "0%", "50%", "0%", "50%");
            }
            currentIndexData = 0;
            this.DataUpdate(0);

            var titleOffset = (DirectedDown) ? -53 : 37;
            titleSvg.Centerize(X, Y + titleOffset);

            var textOffset = (DirectedDown) ? -35 : 55;
            textSvg.Centerize(X, Y + textOffset);

            groupSvg.Show();
            // containerSvg.Show();
            // titleSvg.Show();
            // textSvg.Show();
        }

        this.DataUpdate = function(IndexData) {
            var index = ((IndexData > 0) && (IndexData < data.length)) ? IndexData : 0;
            titleSvg.SetText(data[IndexData].title);
            textSvg.SetText(data[IndexData].text);
            gradientSvg.SetColors([
                { color: data[IndexData].color },
                { color: backgroundColor }
            ]);
        }

        this.PreviousData = function() {
            if (data.length === 0)
                return;
            currentIndexData--;
            if (currentIndexData < 0)
                currentIndexData = data.length - 1;
            this.DataUpdate(currentIndexData);
        }

        this.NextData = function() {
            if (data.length === 0)
                return;
            currentIndexData++;
            if (currentIndexData >= data.length)
                currentIndexData = 0;
            this.DataUpdate(currentIndexData);
        }



        this.Hide = function() {
            data = [];

            groupSvg.Hide();        
            // containerSvg.Hide();
            // titleSvg.Hide();
            // textSvg.Hide();
        }

        initialize();
    }
})(window.StrGrid);