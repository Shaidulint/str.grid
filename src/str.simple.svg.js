(function(local){
    
    var SvgGraphic = function(DomElement) {
        this.paper = null;
        this.domId = null;
        if (typeof DomElement === "string") {
            this.paper = document.getElementById(DomElement);
            this.domId = DomElement;
        } else if ((typeof DomElement === "object") && (DomElement.tagName) && (DomElement.tagName === "svg")) {
            this.paper = DomElement;
            this.domId = "svg_" + Math.floor(Math.random() * 1000);
        } else {
            throw Error("Ошибка: В конструктор SvgGraphic не правильно переданы аргументы!")
        }
        //this.paper.setAttribute("xmlns", "http://www.w3.org/2000/svg");//xmlns="http://www.w3.org/2000/svg
        //this.paper.setAttribute("width", "100");
        //this.paper.setAttribute("height", "100");

        this.GetUniqId = function() {
            this.GetUniqId.counter++;
            return this.domId + "_" + this.GetUniqId.counter;
        };
        this.GetUniqId.counter = 0;

        this.GetDefs = function() {
            if (!this.GetDefs.defs) {
                this.GetDefs.defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                this.paper.insertBefore(this.GetDefs.defs, this.paper.firstChild);
            }
            return this.GetDefs.defs;
        }
        this.GetDefs.defs = null;
    }

    //  Элементальный объект SVG с общими свойствами
    var SvgElement = function(Graphic, TypeSvgElement) {
        this.Element = document.createElementNS(Graphic.paper.namespaceURI, TypeSvgElement);
        Graphic.paper.appendChild(this.Element);
    }

    SvgElement.prototype.SetStroke = function(Width, Color) {
        this.Element.setAttribute('stroke-width', Width);
        this.Element.setAttribute('stroke', Color);
    }

    SvgElement.prototype.SetFill = function(Color) {
        this.Element.setAttribute('fill', Color);
    }
    SvgElement.prototype.Hide = function() {
        this.Element.setAttribute('visibility', "hidden");
    }
    SvgElement.prototype.Show = function() {
        this.Element.setAttribute('visibility', "visible");
    }


    //  Объект SVG Path
    var SvgPath = function(Graphic, StringPath) {
        SvgElement.apply(this, [Graphic, 'path']);
        this.Element.setAttribute('d', StringPath);
        this.SetFill('#000');
    }
    SvgPath.prototype = Object.create(SvgElement.prototype);
    SvgPath.prototype.constructor = SvgElement;

    SvgPath.prototype.SetPath = function (StringPath) {
        this.Element.setAttribute('d', StringPath);
    }

    SvgPath.GeneratePolyline = function(ArrPoints) {
        var str = "M";
        for(var i in ArrPoints) {
            var p = ArrPoints[i];
            if (p != null) {
                str += p.x +"," + p.y + " ";
            }
        }
        return str;
    }
    SvgPath.GenerateRoundRectangle = function(X1, Y1, Width, Height, Radius, Closed) {
        var X2 = X1 + Width;
        var Y2 = Y1 + Height
        var str = "M" + (X1 + Radius) + "," + Y1;
        str += " L" + (X2 - Radius) + "," + Y1;
        str += " A" + Radius + " " + Radius + ", 0, 0, 1," + X2 + " " + (Y1 + Radius);
        str += " L" + X2 + "," + (Y2 - Radius);
        str += " A" + Radius + " " + Radius + ", 0, 0, 1," + (X2 - Radius) + " " + Y2;
        str += " L" + (X1 + Radius) + "," + Y2;
        str += " A" + Radius + " " + Radius + ", 0, 0, 1," + X1 + " " + (Y2 - Radius);
        str += " L" + X1 + "," + (Y1 + Radius);
        str += " A" + Radius + " " + Radius + ", 0, 0, 1," + (X1 + Radius) + " " + Y1;
        if (Closed) {
            str += " Z";
        }
        return str;
    }


    //  Объект SVG Круг
    var SvgCircle = function(Graphic, X, Y, Radius) {
        SvgElement.apply(this, [Graphic, 'circle']);
        this.Element.setAttribute('cx', X);
        this.Element.setAttribute('cy', Y);
        this.Element.setAttribute('r', Radius);
        this.SetFill('#000');
    }
    SvgCircle.prototype = Object.create(SvgElement.prototype);
    SvgCircle.prototype.constructor = SvgElement;

    SvgCircle.prototype.SetPosition = function(X, Y) {
        this.Element.setAttribute('cx', X);
        this.Element.setAttribute('cy', Y);
    }
    SvgCircle.prototype.SetRadius = function(R) {
        this.Element.setAttribute('r', R);
    }

    //  Объект SVG Текст
    var SvgText = function(Graphic, X, Y, Text) {
        SvgElement.apply(this, [Graphic, 'text']);
        this.SetPosition(X, Y);
        this.SetFontSize(12);
        this.SetFont('Verdana');
        this.SetText(Text);
    }
    SvgText.prototype = Object.create(SvgElement.prototype);
    SvgText.prototype.constructor = SvgElement;

    SvgText.prototype.SetText = function(Text) {
        this.Element.textContent = Text;
    }
    SvgText.prototype.SetPosition = function(X, Y) {
        this.Element.setAttribute('x', X);
        this.Element.setAttribute('y', Y);
    }
    SvgText.prototype.SetFont = function(FontFamily) {
        this.Element.setAttribute('font-family', FontFamily);
    }
    SvgText.prototype.SetFontSize = function(FontSize) {
        this.Element.setAttribute('font-size', FontSize);
    }
    SvgText.prototype.Centerize = function(X, Y) {
        var box = this.Element.getBoundingClientRect();
        this.SetPosition(X - box.width/2, Y + box.height/4);
    }
    SvgText.prototype.SetBold = function(DoBold) {
        if (DoBold)
            this.Element.setAttribute('font-weight', 'bold');
        else
            this.Element.setAttribute('font-weight', 'normal');
    }

    //  Объект SVG Group
    var SvgGroup = function(Graphic) {
        this.Element = document.createElementNS(Graphic.paper.namespaceURI, 'g');
        Graphic.paper.appendChild(this.Element);
    }
    SvgGroup.prototype.Add = function(SvgEl) {
        this.Element.appendChild(SvgEl.Element);
    }
    SvgGroup.prototype.Remove = function(SvgEl) {
        this.Element.removeChild(SvgEl.Element);
    }
    SvgGroup.prototype.Clear = function() {
        while (this.Element.firstChild) {
            this.Element.removeChild(this.Element.firstChild);
        }
    }
    SvgGroup.prototype.Hide = function() {
        this.Element.setAttribute('visibility', "hidden");
    }
    SvgGroup.prototype.Show = function() {
        this.Element.setAttribute('visibility', "visible");
    }


    var SvgLinearGradient = function(Graphic, ArrayColors) {
        var self = this;
        self.uniqId = null;
        self.element = document.createElementNS(Graphic.paper.namespaceURI, 'linearGradient');
        Graphic.GetDefs().appendChild(self.element);
        var primoryInitialize = function() {
            self.uniqId = Graphic.GetUniqId();
            self.element.setAttribute("id", self.uniqId);
            for(var i in ArrayColors) {
                var color  = ArrayColors[i];
                var colorElement = document.createElementNS(Graphic.paper.namespaceURI, 'stop');
                if (color.color) {
                    colorElement.setAttribute("stop-color", color.color);
                }
                if (color.offset) {
                    colorElement.setAttribute("offset", color.offset);
                }
                self.element.appendChild(colorElement);
            }
        }

        this.FillTo = function(Element) {
            Element.setAttribute('fill', 'url(#' + self.uniqId + ')');
        }

        primoryInitialize();
    }

    var SvgRadialGradient = function(Graphic, ArrayColors) {
        var self = this;
        self.uniqId = null;
        self.element = document.createElementNS(Graphic.paper.namespaceURI, 'radialGradient');
        Graphic.GetDefs().appendChild(self.element);
        var primoryInitialize = function() {
            self.uniqId = Graphic.GetUniqId();
            self.element.setAttribute("id", self.uniqId);
            updateColors(ArrayColors);
        }

        this.FillTo = function(Element) {
            Element.setAttribute('fill', 'url(#' + self.uniqId + ')');
        }

        this.SetPosition = function(CenterX, CenterY, FocusX, FocusY, Radius) {
            self.element.setAttribute('cx', CenterX);
            self.element.setAttribute('cy', CenterY);
            self.element.setAttribute('fx', FocusX);
            self.element.setAttribute('fy', FocusY);
            self.element.setAttribute('r', Radius);
        }

        this.SetColors = function(ArrayColors) {
            while(self.element.firstChild)
                self.element.removeChild(self.element.firstChild);
            updateColors(ArrayColors);
        }

        var updateColors = function(ArrayColors) {
            for(var i = 0; i < ArrayColors.length; i++) {
                var color  = ArrayColors[i];
                var colorElement = document.createElementNS(Graphic.paper.namespaceURI, 'stop');
                if (color.color) {
                    colorElement.setAttribute("stop-color", color.color);
                }
                if (color.offset) {
                    colorElement.setAttribute("offset", color.offset);
                } else {
                    var percentage = (100 / (ArrayColors.length - 1)) * i;
                    colorElement.setAttribute("offset", percentage + "%");
                }
                if (color.opacity != undefined) {
                    colorElement.setAttribute("stop-opacity", color.opacity);
                }
                self.element.appendChild(colorElement);
            }
        }

        primoryInitialize();
    }

    local.SvgGraphic = SvgGraphic;
    local.SvgElement = SvgElement;
    local.SvgPath = SvgPath;
    local.SvgCircle = SvgCircle;
    local.SvgText = SvgText;
    local.SvgGroup = SvgGroup;
    local.SvgLinearGradient = SvgLinearGradient;
    local.SvgRadialGradient = SvgRadialGradient;

})(window.StrGrid);