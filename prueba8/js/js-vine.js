
var novel_script;
/*
    Un personaje es un actor que puede hablar y ser mostrado.
    
    name: el nombre del personaje
    escName: la versión de escape () del nombre; utilizado como un atributo id = ""
    color: color de texto para este personaje
    image: un objeto de imagen que contiene la imagen para mostrar
    imageElement: un elemento <img> para ingresar al DOM
    src: el atributo fuente actual
    prevSrc: fuente anterior (para detectar cambios)
    domRef: una referencia al elemento <img> una vez insertado en el DOM
    position: dónde mostrar el personaje
    prevPosition: último lugar mostrado (para detectar cambios)
    alpha: transparencia (0 = transparente, 1.0 = opaco)
    visibility: "visible" u "oculto" (como en CSS)
*/

function Character(characterName)
{
    this.name = characterName;
    if (characterName == '')
    {
        characterName = "anon" + novel.anonymous++;
    }
    this.escName = escape(characterName);
    this.color = "#000000";
    this.image = new Image();
    this.imageElement = document.createElement("img");
    this.imageElement.setAttribute("id", this.escName);
    this.src = null;
    this.prevSrc = null;
    this.avatar = "";
    this.domRef = null;
    this.position = new Position(0, 0, true);
    this.prevPosition = new Position(0, 0, true);
    this.alpha = 1.0;
    this.visibility = "visible";
    
    /*
        Si se da un segundo argumento, es un objeto anónimo
        que da la imagen inicial y la posición de este personaje
    */
    if (arguments.length > 1)
    {
        var obj = arguments[1];
        this.color = obj.color || this.color;
        if (obj.image)
        {
            this.image.setAttribute("src", novel.imagePath +
                obj.image.replace(/{{(.*?)}}/g, novel_interpolator));
        }
        this.position = obj.position || new Position(0, 0, true);
    }
}

/*
    Si el <img> para este personaje no está ya en el DOM,
    agréguelo al cuadro y empújelo en la matriz de la novela
    de actores que están en la pantalla.
*/
Character.prototype.display = function(param)
{
    var closure = this;
    var displayImage = true;
    
    /*
        Si el parámetro es un objeto, establece las propiedades del personaje.
        A las propiedades dadas en el parámetro.
    */
    if (param && param.constructor == Object)
    {
        for (var property in param)
        {
            if (property == "image")
            {
                if (param.image != null)
                {
                    this.image.src = novel.imagePath +
                    param.image.replace(/{{(.*?)}}/g, novel_interpolator);
                }
                else
                {
                    displayImage = false;
                }
            }
            else if (property != "say")
            {
                this[property] = param[property];
            }
        }
    }
    
    /*
        El ancho y la altura de la imagen no se establecen inmediatamente si el
        La imagen no está en caché, así que espere 30 milisegundos para finalizar la visualización.
    */
    novel.paused = true;
    // novel.frame -= 2;   // playNovel will increment this...
    setTimeout( function() { return closure.finishDisplay.apply( closure, [param, displayImage] ); }, 30 );
}

Character.prototype.finishDisplay = function(param, displayImage)
{
    if (this.image.complete)
    {
        /*
            ¿Ha cambiado el ancho, la altura o la posición?
            Si es así, oculta este personaje.
        */
        var pos = this.position;
        var el = this.domRef;
        var xPos = pos.x;
        var yPos = pos.y;
        var changed = false;

        if (this.domRef == null)
        {
            this.imageElement.style.visibility = 'hidden';
            novel.tableau.appendChild(this.imageElement);
            novel.actors.push(this);
            this.domRef = document.getElementById(this.escName);
            el = this.domRef;
            changed = true;
        }
        else
        {
            changed = (!pos.equals(this.prevPosition) ||
            this.image.width != this.domRef.width ||
            this.image.height != this.domRef.height)
        }
        
        el.src = this.image.src;    // cargar en la nueva imagen
        
        if (changed && displayImage)
        {
            /*
                luego establece su posición, visibilidad y transparencia
            */
            if (pos.xRelative)
            {
                xPos *= novel.width;
            }
            if (pos.yRelative)
            {
                yPos *= novel.height;
            }
            novel.waitCount = 0;
            xPos -= Math.floor(pos.xAnchor * this.image.width);
            yPos -= Math.floor(pos.yAnchor * this.image.height);
            el.style.position = "absolute";
            el.style.left = xPos + "px";
            el.style.top = yPos + "px";
            el.style.visibility = this.visibility;
            this.prevPosition = this.position.clone();
        }

		if (displayImage)
		{
            novel_setAlpha(this.domRef, this.alpha);
		}
			
        
        if (param && param.say)
        {
            this.say(param.say);
            if (param.noPause)
            {
                playNovel();
            }
        }
        else
        {
            playNovel();
        }
    }
    else 
    {
        /* La imagén no está cargada todavía, intentelo de nuevo en 30 milisegundos */
        novel.waitCount++;
        var closure = this;
        setTimeout( function() {
            return closure.finishDisplay.apply( closure, [param, displayImage] );
        }, 30 );
    }
}

/*
    Un método de conveniencia; el parámetro es Verdadero o falso
    para mostrar u ocultar un personaje
*/
Character.prototype.show = function(visible)
{
    if (this.domRef)
    {
        this.domRef.style.visibility = (visible) ? "visible" : "hidden";
    }
}

/*
    Establecer la transparencia. Si la imagen es completamente opaca,
    Debemos eliminar la información de estilo, ya que IE desenfoca la imagen.
    incluso cuando alfa es 100
*/
Character.prototype.setAlpha = function(alpha)
{
    novel_setAlpha(this, alpha);
}

/*
    Muestra el nombre del personaje (si lo hay) y el
    cadena dada en el área <div id = "dialog">.
    
    Cualquier cosa en {{}} está interpolada.
*/
Character.prototype.say = function(str)
{
    var htmlStr = "";
    var interpolatedString = str;
    clearDialog();
    if (this.avatar != "")
    {
        htmlStr += '<img src="' +
            novel.imagePath +
            this.avatar.replace(/{{(.*?)}}/g, novel_interpolator) +
            '" class="avatar"/>';
    }
    if (this.name != "")
    {
        htmlStr += '<span style="color: ' + this.color + '">' +
        this.name + ':</span><br />';
    }
    if (str.indexOf("{{") >= 0)
    {
        str = str.replace(/{{(.*?)}}/g, novel_interpolator);
    }
    htmlStr += str;
    novel.dialog.innerHTML = htmlStr;
    novel.paused = true;
    // novel.paused = (arguments.length == 1) ? true : (!arguments[1]);     
}

/*
    La novela les dice a los personajes que hagan alguna acción. Si
    el parámetro es una cadena(UN sTRING), entonces el personaje está hablando;
    si es un objeto, entonces el personaje se muestra.
*/
Character.prototype.doAction = function(param)
{
    if (param == null || param == "" || param.constructor == Object)
    {
        this.display(param);
    }
    else if (param.constructor == String)
    {
        this.say(param);
    }
}


/* ============================================== */
/*
    Un TextBlock es un bloque de texto que se puede mostrar.
    
    name: el nombre para este bloque de texto
    escName: el escape () del nombre; utilizado como un atributo id = ""
    color: color de texto para este bloque
    background: color de fondo para este bloque
    div: un elemento <div class = "textClass"> que contiene el texto
    domRef: una referencia a la <div> una vez insertada en el DOM
    positión: dónde mostrar este bloque de texto
    align: alineación de texto, como en CSS
    border: una especificación de bordes, como en CSS
    font: la fuente a usar para mostrar el texto
    widht:% del ancho de la ventana; rango de 0 a 1.0
    visibility: "visible" u "oculto", como en CSS
    text: en realidad, una cadena HTML para mostrar dentro del área de texto
*/
function TextBlock(textName)
{
    if (textName == '')
    {
        textName = "anon" + novel.anonymous++;
    }
    this.escName = escape(textName);
    this.color = "#000000";
    this.div = document.createElement("div");
    this.div.setAttribute("id", this.escName);
    this.div.setAttribute("class", "textClass");
    this.div.setAttribute("className", "textClass");
    this.domRef = null;
    this.position = new Position(0, 0, true);
    this.align = "left";
    this.font = '20px "Deja Vu Sans", Helvetica, Arial, sans-serif';
    this.width = 1.0; // decimal percentage
    this.visibility = "visible";
    this.text = "";
    
    /*
        Si se le da un segundo parámetro, use sus campos
        para establecer los campos del TextBlock
    */
    if (arguments.length > 1)
    {
        var param = arguments[1];
        for (var property in param)
        {
            this[property] = param[property];
        }
    }
}

/*
    Método de conveniencia para configurar el HTML dentro de un bloque de texto
*/
TextBlock.prototype.setText = function(html)
{
    this.domRef.innerHTML = html;
}

/*
    Establecer la transparencia. Si la imagen es completamente opaca,
    Debemos eliminar la información de estilo, ya que IE desenfoca la imagen.
    incluso cuando alfa es 100.
*/
TextBlock.prototype.setAlpha = function(alpha)
{
    novel_setAlpha(this, alpha);
}

/*
    Mostrar bloque de texto en la pantalla
*/
TextBlock.prototype.display = function(param)
{
    /*
        Si el <div> aún no está en el DOM, insértelo,
        y añadirlo a la lista de actores en el cuadro.
    */
    if (this.domRef == null)
    {
        novel.tableau.appendChild(this.div);
        novel.actors.push(this);
    }
    this.domRef = document.getElementById(this.escName);
    
    novel_textEntity_display(this, param);
}

function novel_textEntity_display(obj, param)
{
    /*
        Oculta el texto, luego mira el parámetro y toma
        Acción apropiada dependiendo de su tipo.
    */
    var el = obj.domRef;
    var xPos;
    var yPos;

    el.style.visibility = "hidden";
    if (param != null)
    {
        if (param.constructor == Position)
        {
            obj.position = param;
        }
        else if (param.constructor == String)
        {
            obj.text = param;
        }
        else if (param.constructor == Object)
        {
            for (var propertyName in param)
            {
                obj[propertyName] = param[propertyName];
            }
        }
    }
    // establece el texto
    el.innerHTML = obj.text.replace(/{{(.*?)}}/g,
        novel_interpolator);

    xPos = obj.position.x;
    yPos = obj.position.y;
    
    // y su posición y atributos
    if (obj.position.xRelative)
    {
        xPos *= novel.width;
    }
    if (obj.position.yRelative)
    {
        yPos *= novel.height;
    }
    if (obj.color)
    {
        el.style.color = obj.color;
    }
    if (obj.backgroundColor)
    {
        el.style.backgroundColor = obj.backgroundColor;
    }
    if (obj.font)
    {
        el.style.font = obj.font;
    }
    if (obj.border)
    {
        el.style.border = obj.border;
    }
    if (obj.padding)
    {
        el.style.padding = obj.padding;
    }
    if (obj.align)
    {
        el.style.textAlign = obj.align;
    }
    if (!obj.visibility)
    {
        obj.visibility = "visible";
    }
    el.style.position = "absolute";
    el.style.width = Math.floor(obj.width * 100) + "%";
    el.style.left = xPos + "px";
    el.style.top = yPos + "px";
    el.style.visibility = obj.visibility; // luego revela (si es visible)
}

/*
    Un método de conveniencia; el parámetro es verdadero o falso
    para mostrar u ocultar un bloque de texto
*/
TextBlock.prototype.show = function(visible)
{
    if (this.domRef)
    {
        this.domRef.style.visibility = (visible) ? "visible" : "hidden";
    }
}

/*
    En este momento, la única acción que un bloque de texto puede
    Tomar es mostrarse a sí mismo.
*/
TextBlock.prototype.doAction = function(param)
{
    this.display(param);
}

/*
    Una entrada es un bloque de texto que se puede mostrar.
    
    name: el nombre para este bloque de texto
    escName: el escape () del nombre; utilizado como un atributo id = ""
    color: color de texto para este bloque
    background: color de fondo para este bloque
    inputElement: un elemento <input type = "text" class = "textClass"> que contiene el texto
    domRef: una referencia a la <div> una vez insertada en el DOM
    positión: dónde mostrar este bloque de texto
    align: alineación de texto, como en CSS
    border: una especificación de frontera como en CSS
    font: la fuente a usar para mostrar el texto
    widht:% del ancho de la ventana; rango de 0 a 1.0
    visibility: "visible" u "oculto", como en CSS
    text: valor inicial del campo de texto
*/
function Input(textName)
{
    if (textName == '')
    {
        textName = "anon" + novel.anonymous++;
    }
    this.escName = escape(textName);
    this.color = "#000000";
    this.inputElement = document.createElement("input");
    this.inputElement.setAttribute("type", "text");
    this.inputElement.setAttribute("id", this.escName);
    this.inputElement.setAttribute("class", "textClass");
    this.inputElement.setAttribute("className", "textClass");
    if (this.inputElement.addEventListener)
    {
        this.inputElement.addEventListener("change", novel_inputChange, false);
    }
    else
    {
        this.inputElement.attachEvent("onchange", novel_inputChange);
    }
    this.domRef = null;
    this.position = new Position(0, 0, true);
    this.align = "left";
    this.font = '20px "Deja Vu Sans", Helvetica, Arial, sans-serif';
    this.width = 1.0; // decimal percentage
    this.visibility = "visible";
    this.text = "";
    
    /*
        Si se le da un segundo parámetro, use sus campos
        para establecer los campos de entrada
    */
    if (arguments.length > 1)
    {
        var param = arguments[1];
        for (var property in param)
        {
            this[property] = param[property];
        }
    }
}

/*
    Método de conveniencia para establecer el valor inicial del campo de entrada
*/
Input.prototype.setValue = function(txt)
{
    this.domRef.value = txt;
}

/*
    establecer la transparencia.
*/
Input.prototype.setAlpha = function(alpha)
{
    novel_setAlpha(this, alpha);
}

/*
    mostrar el bloque de texto en la pantalla
*/
Input.prototype.display = function(param)
{
    /*
        Si el <input> aún no está en el DOM, insértelo,
        y añadirlo a la lista de actores en el cuadro.
    */
    if (this.domRef == null)
    {
        novel.tableau.appendChild(this.inputElement);
        novel.actors.push(this);
    }
    this.domRef = document.getElementById(this.escName);
    this.domRef.value = this.text;
    this.domRef.focus();
    
    novel_textEntity_display(this, param);
    novel.paused = true;
    novel.ignoreClicks = true;
}

/*
    Un método de conveniencia; el parámetro es verdadero o falso
    para mostrar u ocultar un bloque de texto
*/
Input.prototype.show = function(visible)
{
    this.domRef.style.visibility = (visible) ? "visible" : "hidden";
}

/*
    En este momento, la única acción que un bloque de texto puede
    Tomar es mostrarse a sí mismo.
*/
Input.prototype.doAction = function(param)
{
    this.display(param);
}

function novel_inputChange(evt)
{
    var inputObj;
    var str; //SERÁ LO QUE ESCRIBAMOS
    var actor;
    if (!evt)
    {
        evt = window.event;
    }
    inputObj = evt.target;
    str = inputObj.value; // aqui creo que está mi comentario en el input
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    novel.userVar[inputObj.id] = str;
    //if (src != null)  NO VA?? QUE PRETENDE??
    //{
     //   selfReply(str);
    //}

    evt.cancelBubble = true;
    if (evt.stopPropagation)
    {
        //selfReply(str); // Funciona pero me dá error en input-Automatico
        selfReply(inputObj.value); //Asi mejor?
        evt.stopPropagation();
    }
   // novel.ignoreClicks = true;
    novel.ignoreClicks = false;
    actor = novel.actors.pop();
    inputObj = actor.domRef;
    if (inputObj != null)
    {
        //selfReply(str);  //SI VA
        //selfReply(inputObj.value);  //SI VA
        //selfReply(inputObj.id); .. NO VA, ES "NAME"
        inputObj.parentNode.removeChild(inputObj);//ESTO borra el input
        //document.getElementsByClassName("messages").reset(); //NO

        // en la función visible, consigue borrar mi patron y solamente
        // dejar la respuesta del bot
        message_container.innerHTML = ""; // SI, con el 'caso SUB'
    }

    //if(inputObj.value == null)
   // {
   //     actor.domRef = null; // ??
   //     playNovel(); // continuar la historia?
  //  }
  //  else
  //  {
   //     novel_inputChange();
   // }
    actor.domRef = null; // ??
    playNovel(); // continuar la historia??
}

/* ============================================== */
/*
    Un MenuItem es un actor, pero a diferencia de un Personaje
    o un TextBlock, no tiene métodos; en lugar,
    La función de menú maneja todo lo asociado.
    con los menús.
*/
function MenuItem(n, text, label)
{
    this.domRef = document.createElement("div");
    this.domRef.setAttribute("id", "menuItem" + n);
    this.domRef.setAttribute("class", "menuItem");
    this.domRef.setAttribute("className", "menuItem");
    this.text = text;
    this.label = label;
}

/* ============================================== */
/*
    Una posición especifica la posición de la pantalla de un elemento
    (x, y); si las coordenadas son absolutas (pixeles)
    o relativo (porcentaje decimal en el rango 0-1.0).
    
    xAnchor y yAnchor se utilizan para desplazar la "parte superior izquierda"
    Punto de una imagen.
    
    Supongamos que una imagen que es 200 x 150 normalmente
    se mostrará con su esquina superior izquierda en (300, 400).
    Si xAnchor es .2 y yAnchor es .5, entonces la imagen
    se mostrará en la coordenada superior izquierda
    de (300 - (200 * .2), 400 - (150 * .5)), o (260, 325).
*/
function Position(x, y)
{
    this.x = x
    this.y = y
    this.xRelative = (x <= 1.0);
    this.yRelative = (y <= 1.0);
    this.xAnchor = (arguments.length >= 3) ? arguments[2] : 0;
    this.yAnchor = (arguments.length >= 4) ? arguments[3] : 0;
}

/*
    Compara dos objetos de Posición para la igualdad; devoluciones
    verdadero o falso
*/
Position.prototype.equals = function(other)
{
    return (this.x == other.x && this.y == other.y &&
        this.relative == other.relative &&
        this.xAnchor == other.xAnchor && this.yAnchor == other.yAnchor); 
}

/*
    Crea un duplicado de una posición; necesario para asegurarse
    que las posiciones actuales y anteriores de un personaje
    Son dos objetos separados.
*/
Position.prototype.clone = function()
{
    var newPos = new Position(this.x, this.y, this.relative);
    newPos.xAnchor = this.xAnchor;
    newPos.yAnchor = this.yAnchor;
    return newPos;
}

/* =========================================================== */

/*
    Estas son las funciones para conducir la novela.
    Aunque solo hay una novela, creo un objeto para ella.
    Para evitar contaminar las variables del espacio de nombres. Más allá de eso
    Ya está contaminado, eso es.
    
    frame: el fotograma actual que está en pantalla
    tableau: the <div id = "novel"> (El nombre proviene de los juegos de cartas)
    diálog: el <div id = "dialog"> donde los caracteres "hablan"
    audio: el <div id = "audio"> (si existe, para la música)
    audioLoop: un booleano que indica si el audio está en bucle o no
    paused: en espera de un clic. Necesitamos esto porque JavaScript no puede
        Espera () o duerme ().
    history: realiza un seguimiento del camino a través de la novela (todavía no se utiliza)
    historyPos: posición en la historia (no utilizada aún)
    ignoreClicks: es un menú o entrada en pantalla? (Si es así, ignora los clics en el cuadro / diálogo)
    labels: matriz asociativa de todas las etiquetas definidas en el script
    subs: matriz asociativa de todas las subrutinas definidas en el script
    callStack: realiza un seguimiento de las declaraciones de llamada (a "subrutinas" en el script)
    anonymous: ¿cuántos bloques de texto o actores sin nombre hemos creado?
    actors: la lista de caracteres y bloques de texto actualmente en el cuadro
    userVar: "variables" definidas en el script (matriz asociativa)
    scriptStack: pila de scripts actual; utilizado en los menús
    ifStack: realiza un seguimiento de si estás en ese momento o parte de tu anidado si
    backgroundImage: matriz de imagen de fondo; para desvanecerse / disolverse
        background, tiene que ser una imagen en lugar de un estilo CSS de fondo.
    pendingBackgroundImage: esta es la imagen de fondo que está esperando para cargarse
    activeBG: ¿qué fondo está activo (0 o 1)?
    bgAlpha: la transparencia de la imagen de fondo (0 = transparente, 1 = opaco)
    waitCount: # de veces en espera para completar la carga de la imagen (utilizada para
        depuración)
    pauseTimer: un temporizador para el comando de pausa
    mappedImage: qué imagen (si existe) tiene un mapa de imagen adjunto
    lastClick: se utiliza para garantizar al menos 1/4 de segundo entre clics
*/

function Novel() {
    this.frame = 0;
    this.tableau = null;
    this.dialog = null;
    this.audio = null;
    this.audioLoop = false;
    this.paused = false;
    this.history = new Array();
    this.historyPos = 0;
    this.ignoreClicks = false;
    this.labels = new Array();
    this.subs = new Array();
    this.callStack = new Array();
    this.anonymous = 0;
    this.actors = new Array(); // who is on screen right now?
    this.userVar = new Object();
    this.ifLevel = 0;
    this.ifStack = new Array();
    this.scriptStack = new Array();
    this.backgroundImage = new Array(2);
    this.pendingBackgroundImage;
    this.activeBG = 0;
    this.bgAlpha = 1.0;
    this.waitCount = 0;
    this.pauseTimer = null;
    this.mappedImage = null;
    this.lastClick = new Date().getTime();
}

/*
    Con el fin de evitar problemas de unión con "esto",
    Las funciones restantes son globales. Funciones que
    las secuencias de comandos directamente no tienen prefijo; funciones
    Que son internos comienzan con novel_, nuevamente para evitar.
    Contaminando el espacio de nombres. Promover.
*/

/*
    Este método interpola expresiones {{...}}
    en cuerdas.
*/
function novel_interpolator(str, p1, offset, s)
{
    return eval(p1);
}

/*
    Eliminar todos los elementos del menú del cuadro.
*/
function novel_clearMenuItems()
{
    var actor;
    var domObject;
    var i;
    if (novel)
    {
        i = 0;
        while (i < novel.actors.length)
        {
            if (novel.actors[i].constructor == MenuItem)
            {
                domObject = novel.actors[i].domRef;
                if (domObject != null)
                {
                    domObject.parentNode.removeChild(domObject);
                }
                novel.actors[i].domRef = null;
                novel.actors.splice(i, 1);
            }
            else
            {
                i++;
            }
        }
    }
}

/*
    Cuando el usuario hace clic en un elemento del menú, invoca el novel_menuJump
    función. Esta función une el clic apropiado
*/
function novel_addOnClick(el, value)
{
    el.onclick = function(e) { novel_menuJump.apply(window, [value, e]); return false;};
}

/*
    Manejar un clic en un elemento del menú. Detener la propagación del evento.
    Para que el tableau no intercepte el evento. 
    Establezca novel_script a la menu`s script y al frame
    al primer comando en ese script. Entonces
    start playing la novela
*/
function novel_menuJump(menuScript, evt)
{
    if (!evt)
    {
        evt = window.event;
    }
    evt.cancelBubble = true;
    if (evt.stopPropagation)
    {
        evt.stopPropagation();
    }
    novel_clearMenuItems();
    novel.dialog.style.textAlign = "left";
    novel.ignoreClicks = false;
    novel_pushScript();
    novel_script = menuScript;
    novel.frame = 0;
    playNovel();
}

/*
    Desvanece el background disminuyendo
    Su alfa en un 10% cada 0.1 segundos. Cuando totalmente
    transparente, cambiar a la nueva background,
    y empieza a desvanecerse.
*/
function novel_fadeBgOut(targetAlpha)
{
    var bg = document.getElementById("background" + novel.activeBG);
    novel.bgAlpha -= 0.1;
    bg.style.filter = "alpha(opacity=" + Math.floor(novel.bgAlpha*100) + ")";
    bg.style.opacity = novel.bgAlpha;
    if (novel.bgAlpha > 0)
    {
        setTimeout("novel_fadeBgOut(" + targetAlpha + ")", 100);
    }
    else
    {
        bg.src = novel.imagePath + novel.backgroundImage[novel.activeBG];
        novel.pendingBackgroundImage = bg;
        novel.paused = true;
        setTimeout('novel_finishLoadingBackground("fade", ' + targetAlpha + ')', 30);
    }
}
    
/*
    Se desvanece en el background aumentando
    Su alfa en un 10% cada 0.1 segundos. Cuando totalmente
    Opaco, reinicia jugando la novela.
*/
function novel_fadeBgIn(targetAlpha)
{
    var bg = document.getElementById("background" + novel.activeBG);
    novel.bgAlpha += 0.1;
    if (novel.bgAlpha < targetAlpha)
    {
        bg.style.filter = "alpha(opacity=" +
            Math.floor(novel.bgAlpha*100) + ")";
        bg.style.opacity = novel.bgAlpha;
        setTimeout("novel_fadeBgIn(" + targetAlpha + ")", 100);
    }
    else
    {
        novel_setAlpha(bg, targetAlpha);
        novel.bgAlpha = targetAlpha;
        playNovel();
    }
}

/*
    Disuelva entre el background alterando las de cada uno.
    alfa en un 10% cada 0.1 segundos. Cuando uno es totalmente
    Transparente, el otro será totalmente opaco.
*/
function novel_dissolveIn(targetAlpha, n)
{
    var bgA = document.getElementById("background" + novel.activeBG);
    var bgB = document.getElementById("background" + (1 - novel.activeBG));
    n++;
    novel_setAlpha(bgA, novel.bgAlpha * (10 - n) / 10);
    novel_setAlpha(bgB, targetAlpha * n / 10);
    if (n < 10)
    {
        setTimeout("novel_dissolveIn(" + targetAlpha + "," + n + ")", 100);
    }
    else
    {
        novel_setAlpha(bgA, 0);
        novel_setAlpha(bgB, targetAlpha);
        novel.activeBG = 1 - novel.activeBG;
        novel.bgAlpha = targetAlpha;
        playNovel();
    }
}
    
/*
    Crear la matriz(array) asociativa de las labels y
    Sus frames numbers en el main script. Solo el
    Se escanean las principales etiquetas de script; etiquetas en
    Menús o si se ignoran las sentencias.
*/
function novel_collectLabels()
{
    for (var i = 0; i < novel_script.length; i += 2)
    {
        if (novel_script[i] == label)
        {
            novel.labels[novel_script[i + 1]] = i;
        }
        else if (novel_script[i] == sub)
        {
            novel.subs[novel_script[i+1]] = i;
        }
    }
}
        
/*
    Guardar una referencia a la matriz de secuencias de comandos
    y el marco
*/
function novel_pushScript()
{
    novel.scriptStack.push(novel_script);
    novel.scriptStack.push(novel.frame);
}

/*
    Restaurar la matriz de secuencias de comandos y el marco.
*/
function novel_popScript()
{
    if (novel.scriptStack.length > 0)
    {
        novel.frame = novel.scriptStack.pop() + 2;
        novel_script = novel.scriptStack.pop();
    }
}

/*
    Establecer la transparencia. Si la imagen es completamente opaca,
    Debemos eliminar la información de estilo, ya que IE desenfoca la imagen.
    incluso cuando alfa es 100.
*/
function novel_setAlpha(domRef, alpha)
{
    if (alpha != 1.0)
    {
        domRef.style.filter = "alpha(opacity=" +
            Math.floor(alpha*100) + ")";
        domRef.style.opacity = alpha;
    }
    else
    {
        domRef.style.filter = null;
        domRef.style.opacity = null;
    }
}

function novel_handleClick(evt)
{
    var now = new Date().getTime();
    var ok;
    if (!evt)
    {
        evt = window.event;
    }
    evt.cancelBubble = true;
    if (evt.stopPropagation)
    {
        evt.stopPropagation();
    }
    /*
        No permita dos clics dentro de 1/4 segundo el uno del otro
    */
    ok = (now - novel.lastClick > 250);
    novel.lastClick = now;
    if (ok)
    {
        playNovel();
    }
}

function novel_disableSelection(target)
{
    if (target.onselectstart)
    {
        target.onselectstart = function() {return false;}; // IE
    }
    else if (target.style.MozUserSelect)
    {
        target.style.MozUserSelect = "none"; // firefox
    }
    else
    {
        target.onmousedown = function() {return false}; // everyone else
    }
    target.style.cursor = "default"
}
/*
    Sacar a todos los actores del cuadro, y establecer su
    Referencias DOM a nulo
*/
function clearTableau()
{
    var actor;
    var domObject;
    if (novel)
    {
        while (novel.actors.length > 0)
        {
            actor = novel.actors.pop();
            domObject = actor.domRef;
            if (domObject != null)
            {
                domObject.parentNode.removeChild(domObject);
            }
            actor.domRef = null;
        }
    }
}

/*
    imageMap adjunta un ID de mapa a un personaje;
    Si existe la identificación del mapa, entonces la novela
    pausas para la entrada. Si configura la pantalla activa
    propiedad, entonces el resto de la pantalla seguirá respondiendo.
    a los clics; de lo contrario, el imagemap es modal.
*/
function imagemap(param)
{
    if (param.mapId)
    {
        param.character.domRef.setAttribute("usemap", '#' + param.mapId);
        novel.paused = true;
        novel.ignoreClicks = !(param.screenActive);
        novel.mappedImage = param.character.domRef;
    }
}

function show(param)
{
    if (param.constructor == Character ||
        param.constructor == TextBlock)
    {
        param.display(null);
        param.show(true);
    }
}

function hide(param)
{
    if (param.constructor == Character ||
        param.constructor == TextBlock)
    {
        param.show(false);
    }
}

function remove(param)
{
    var i;
    var foundPos = -1;
    
    if (param.constructor == Character ||
        param.constructor == TextBlock)
    {
        for (i = 0; i < novel.actors.length && foundPos < 0; i++)
        {
            if (novel.actors[i] == param)
            {
                foundPos = i;
            }
        }
        if (foundPos >= 0)
        {
            if (param.domRef)
            {
                param.domRef.parentNode.removeChild(param.domRef);
            }
            param.domRef = null;
            novel.actors.splice(foundPos, 1);
        }
    }
            
}

function stopAudio()
{
    if (novel.audio && novel.audio.src)
    {
        novel.audio.src = null;
    }
}

/*
    Borrar el <div id="dialog">
*/
function clearDialog()
{
    novel.dialog.innerHTML = "";
}

/*
    Establecer la visibilidad del dialogo al valor dado
*/
function showDialog(status)
{
    novel.dialog.style.visibility = status;
}

/*
    Establezca el cuadro de diálogo en el primer elemento en el MenuArray; la
    las entradas restantes son pares de etiquetas de artículos y scripts,
    que están asociados con objetos individuales de MenuItem.
*/
function menu(menuArray)
{
    novel.ignoreClicks = true;
    novel.dialog.innerHTML =
        menuArray[0].replace(/{{(.*?)}}/g, novel_interpolator);
    novel.dialog.style.textAlign="center";
    for (var i = 1; i < menuArray.length; i += 2)
    {
        var mItem = new MenuItem((i-1) / 2, menuArray[i], menuArray[i+1]); 
        var el = mItem.domRef;
        novel_addOnClick(el, menuArray[i+1]);
        el.innerHTML = menuArray[i].replace(/{{(.*?)}}/g, novel_interpolator);
        novel.tableau.appendChild(el);
        novel.actors.push(mItem);
    }
    novel.paused = true;
}

/*
    Todos los saltos vuelven al guión principal, así que saca todos los
    Información en la pila de scripts.
*/
function jump(label)
{
    while (novel.scriptStack.length > 0)
    {
        novel.frame = novel.scriptStack.pop();
        novel_script = novel.scriptStack.pop();
    }
    label = label.replace(/{{(.*?)}}/g, novel_interpolator);
    novel.frame = novel.labels[label];
    /*
        Como esta función es llamada desde playNovel () y
        suma 2 al conteo de cuadros, resta 2 para que
        Saltamos al punto correcto en el script.
    */
    novel.frame -= 2;
}

/*
    Use esto cuando quiera saltar a una etiqueta en una novela basada
    en un imagemap haga clic. Esto también desactivará el mapa de imagen.
*/
function novel_mapJump(label)
{
    jump(label); // nos lleva al lugar correcto para una llamada de playNovel
    novel.frame += 2; // pero lo llamamos cuando playNovel no está activo
    
    if (novel.mappedImage)
    {
        novel.mappedImage.removeAttribute("usemap");
        novel.mappedImage = null;
    }
    
    /*
        Necesitamos devolver false y llamar a playNovel (). Nosotros no podemos
        haga ambas cosas, así que configuraremos un temporizador de 10 ms para llamar a playNovel (),
        y luego devolveremos falso
    */
    novel.ignoreClicks = false;
    setTimeout('playNovel()', 10);
    return false;
}

/*
    Cambia el fondo sin borrar el cuadro o el diálogo.
*/
function background(param)
{
    novel_changeBackground(param, false);
}

/*
    Configurar una nueva escena. En primer lugar, borrar el cuadro y el diálogo.
*/
function scene(param)
{
    novel_changeBackground(param, true);
}

/*
    Si el parámetro era una cadena, es el nombre de un fondo
    imagen. Si el parámetro es un objeto, la propiedad de la imagen es
    El nombre del archivo de fondo y la propiedad de efecto le indican cómo
    Quiero mostrar el fondo. clearAll es un cuento booleano
    Ya sea para borrar el cuadro y el diálogo o no.
*/
function novel_changeBackground(param, clearAll)
{
    var fileName;
    var effect;
    var targetAlpha = 1.0;
    var bg;
    
    if (clearAll)
    {
        clearTableau();
        clearDialog();
    }
    fileName = novel.backgroundImage[novel.activeBG];
    if (typeof param == "string")
    {
        fileName = param;
        effect = "";
    }
    else if (param != null)
    {
        if (param.image)
        {
            fileName = param.image;
        }
        effect = (param.effect) ? param.effect : "";

		if (param.alpha)
		{
			targetAlpha = param.alpha;
		}
    }

    fileName = fileName.replace(/{{(.*?)}}/g, novel_interpolator);
    if (!effect)
    {
        novel.backgroundImage[novel.activeBG] = fileName;
        bg = document.getElementById("background" + novel.activeBG);
        bg.src = novel.imagePath + fileName;
        novel.pendingBackgroundImage = bg;
        novel.paused = true;
    }
    else if (effect == "fade")
    {
        novel.backgroundImage[novel.activeBG] = fileName;
        novel.paused = true;
        novel_fadeBgOut(targetAlpha);
    }
    else if (effect == "dissolve")
    {
        novel.backgroundImage[1 - novel.activeBG] = fileName;
        novel.pendingBackgroundImage = document.getElementById("background" + (1 - novel.activeBG));
        novel.pendingBackgroundImage.src =
            novel.imagePath + fileName;
        novel.paused = true;
    }
    if (effect != "fade")
    {
        setTimeout('novel_finishLoadingBackground("' + effect + '", ' + targetAlpha + ')', 30);
    }
}

/*
    Completa cargando el fondo
*/
function novel_finishLoadingBackground(effect, targetAlpha)
{
    if (novel.pendingBackgroundImage && novel.pendingBackgroundImage.complete)
    {
        if (!effect)
        {
            novel_setAlpha(novel.pendingBackgroundImage, targetAlpha);
            novel.bgAlpha = targetAlpha;
            playNovel();
        }
        else if (effect == "fade")
        {
            novel_fadeBgIn(targetAlpha);
        }
        else if (effect == "dissolve")
        {
            novel_dissolveIn(targetAlpha, 0);
        }
        novel.pendingBackgroundImage = null;
    }
    else
    {
        setTimeout('novel_finishLoadingBackground("' + effect + '", ' + targetAlpha + ')', 30);
    }   
}

/*
    Ir a través del script para encontrar otra cosa que coincida con el nivel actual
    de instrucciones anidadas if (o un nivel coincidente endIf) y return
    ese número de cuadro.
*/
function novel_findMatchingElse()
{
    var currLevel = novel.ifLevel;
    var f = novel.frame + 2;
    var item = novel_script[f];
    while (!((item == elsePart || item == endIf) && currLevel == novel.ifLevel)
         && f < novel_script.length)
    {
        if (item == ifStatement)
        {
            currLevel++;
        }
        else if (item == endIf)
        {
            currLevel--;
        }
        f += 2;
        item = novel_script[f];
    }
    return f;
}

/*
    Ir a través de la secuencia de comandos para encontrar un final que coincida con el nivel actual
    de anidado si las declaraciones y la devolución
    ese número de cuadro.
*/
function novel_findMatchingEndIf()
{
    var currLevel = novel.ifLevel;
    var f = novel.frame + 2;
    var item = novel_script[f];
    while (!(item == endIf && currLevel == novel.ifLevel) && f < novel_script.length)
    {
        if (item == ifStatement)
        {
            currLevel++;
        }
        else if (item == endIf)
        {
            currLevel--;
        }
        f += 2;
        item = novel_script[f];
    }
    return f;
}

/*
    Esta es la función de escucha que se invoca.
    cuando el audio ha terminado; implementa bucle
*/
function novel_audioLoop()
{
    novel.audio.currentTime = 0;
    novel.audio.play();
}

/*
    Llame a una subrutina; una sección del guión con el dado
    etiqueta.
*/
function call(label)
{
    if (typeof novel.subs[label] != 'undefined')
    {
        novel.callStack.push(novel.frame);
        novel.frame = novel.subs[label];
    }
}

/*
    regreso a una llamada de subrutina
*/
function endSub()
{
    if (novel.callStack.length != 0)
    {
        novel.frame = novel.callStack.pop();
    }
}

/*
    Establecer una variable o variables de usuario; El parámetro
    es una cadena que contiene JavaScript para evaluar
    o es un objeto cuyas propiedades se insertan en
    novel.userVar. Si usa la segunda forma, entonces
    cuando se refiere a una variable en una cadena interpolada,
    Debes calificarlo con novel.userVar.
*/
function setVars(param)
{
    if (typeof param == "string")
    {
        eval(param);
    }
    else if (typeof param == "object")
    {
        for (var property in param)
        {
            novel.userVar[property] = param[property];
        }
    }
}

/*
    La etiqueta y las funciones secundarias no hacen nada; son solo
    allí para que podamos usar la etiqueta sin comillas en el script.
*/
function label(str)
{
    // do nothing
}

function sub(str)
{
    // do nothing
}

/*
    Reproduce el audio con el nombre de archivo dado. El valor por defecto
    La acción es NO interrumpir el sonido indefinidamente.
    
    Si se le da un objeto, la propiedad src da el nombre de archivo
    y la propiedad de bucle (boolean) indica si se debe realizar un bucle o no.
    
    Si el parámetro es nulo, el sonido se detiene.
*/

function audio(param)
{
    var audioSource;
    var action = null;
    var mimeType = {"wav": "audio/wav",
        "ogg": 'audio/ogg;codecs="vorbis"',
        "mp3": "audio/mpeg"};
    var suffix = "";
    
    if (novel.audio)
    {
        // stopAudio();
        if (param != null)
        {
            if (param.constructor == String)
            {
                audioSource = param;
                novel.audio.src = novel.audioPath + audioSource;                
                novel.audioLoop = false;
            }
            else if (param.constructor == Object)
            {
                if (param.src)
                {
                    audioSource = param.src;
                    // buscar un formato jugable
                    if (param.format)
                    {
                        for (var i = 0; i < param.format.length && suffix == ""; i++)
                        {
                            if (novel.audio.canPlayType(mimeType[param.format[i]]) != "")
                            {
                                suffix = param.format[i];
                            }
                        }
                    }
                    if (suffix != "")
                    {
                        audioSource = audioSource + "." + suffix;
						novel.audio.src = novel.audioPath + audioSource;
						novel.audioLoop = false;
                    }
					else
					{
						novel.audio.src = "";
					}
                }
                if (param.loop != null)
                {
                    novel.audioLoop = param.loop;
                }
                if (param.action)
                {
                    action = param.action;
                }
            }
            if (novel.audioLoop)
            {
                if (novel.audio.addEventListener)
                {
                    novel.audio.addEventListener('ended', novel_audioLoop, false);
                }
                else if (novel.audio.attachEvent)
                {
                    novel.audio.attachEvent('onended', novel_audioLoop);
                }
            }
            else
            {
                if (novel.audio.removeEventListener)
                {
                    novel.audio.removeEventListener('ended', novel_audioLoop,
                    false);
                }
                else if (novel.audio.detachEvent)
                {
                    novel.audio.detachEvent('onended', novel_audioLoop);
                }
            }
            action = action.replace(/{{(.*?)}}/g, novel_interpolator);
            if (action == "stop")
            {
                novel.audio.src = null;
            }
            else if (action == "rewind")
            {
                novel.audio.currentTime = 0;
            }
            else if (action == "pause")
            {
                novel.audio.pause();
            }
            else if (action == "play")
            {
                novel.audio.play();
            }
           // novel.audio.play();
        }
    }
}

function pause(param)
{
    if (param)
    {
        novel.pauseTimer = window.setTimeout(novel_unPause, parseInt(param, 10));
    }
    novel.paused = true;
}

function novel_unPause()
{
    playNovel();
}
    
/*
    Manejar una sentencia if. El parámetro es un
    Condición a probar (una cadena a evaluar)
*/
function ifStatement(param)
{
    var ok = eval(param);
    if (ok)
    {
        novel.ifStack.push(0); // 0 == "then" part
    }
    else
    {
        novel.frame = novel_findMatchingElse();
        if (novel_script[novel.frame] == elsePart)
        {
            novel.ifStack.push(1);
        }
    }
    novel.ifLevel = novel.ifStack.length;
}

function elsePart()
{
    novel.frame = novel_findMatchingEndIf();
}

function endIf()
{
    if (novel.ifLevel > 0)
    {
        novel.ifLevel--;
        novel.ifStack.pop();
    }
}

/*
    Llame a una función de JavaScript definida por el autor.
    jsInfo.fcn es el nombre de la función;
    jsInfo.params es una matriz de parámetros
*/
function jsCall(jsInfo)
{
    jsInfo.fcn.apply(window, jsInfo.params);
}

/*
    Inicializa el objeto novedoso; los parámetros w y h son
    el ancho y la altura de la <div id = "novel">.
    La función prepareNovel () es proporcionada por el autor del script;
    Establece caracteres y bloques de texto. Siempre empieza la novela
    en la etiqueta "inicio".
*/
function initNovel(w, h)
{
    if ((typeof novel != 'undefined'))
    {
        if (novel.tableau)
        {
            clearTableau();
        }
        if (novel.dialog)
        {
            clearDialog();
        }
        stopAudio();
    }
    novel_disableSelection(document.body);
    novel = new Novel();
    novel.tableau = document.getElementById("novelDiv");
    novel.dialog = document.getElementById("dialogDiv");
    if (novel.tableau.addEventListener)
    {
        novel.tableau.addEventListener('click', novel_handleClick, false);
        novel.dialog.addEventListener('click', novel_handleClick, false);
    }
    else if (novel.tableau.attachEvent)
    {
        novel.tableau.attachEvent('onclick', novel_handleClick);
        novel.dialog.attachEvent('onclick', novel_handleClick);
    }
    if (!!(document.createElement('audio').canPlayType))
    {
        novel.audio = new Audio();
    }
    else
    {
        novel.audio = null;
    }
    novel.width = w;
    novel.height = h;
    prepareNovel();
    novel_setAlpha(document.getElementById("background0"), 1);
    novel_setAlpha(document.getElementById("background1"), 0);
    novel_script = script;
    novel_collectLabels();
    novel.frame = novel.labels["start"];
    playNovel();
}

/*
    Juega la novela. Si no está en el menú, pausado o en la
    Al final de la novela, toma la siguiente entrada en novel_script. Si es
    un carácter o un bloqueo de texto, invoque su función doAction (), usando
    El siguiente elemento en el novel_script como su parámetro.
    
    Si la entrada es una función, entonces invoque esa función con la siguiente
    Elemento en el novel_script como su parámetro.
    
    Si nada de lo anterior, es un error. Dar una alerta.
*/
function playNovel()
{
    var obj;
    if (novel.pauseTimer != null)
    {
        window.clearTimeout(novel.pauseTimer);
        novel.pauseTimer = null;
    }
    novel.paused = false;

    /*
    novel.history.push(novel.frame);
    novel.historyPos++;
    */
    while (!novel.ignoreClicks && novel.frame < novel_script.length && ! novel.paused)
    {
        obj = novel_script[novel.frame];
//      document.getElementById("debug").innerHTML = "frame: " + novel.frame + " " + obj + "/" + novel_script[novel.frame +1];
        if (obj.constructor == Character || obj.constructor == TextBlock ||
            obj.constructor == Input)
        {
            obj.doAction(novel_script[novel.frame+1]);
            novel.frame += 2;
        }
        else if (typeof(obj) == "function")
        {
            novel_script[novel.frame].apply(window, [novel_script[novel.frame+1]]);
            novel.frame += 2;
        }
        else
        {
            alert("Frame " + novel.frame + "\nUnknown: " +
                obj + "\n" + typeof(obj));
            novel.frame += 2;
        }
        /*
            Si al final de un script
            sacarlo a la pila de comandos
        */
        if (novel.frame >= novel_script.length)
        {
            novel_popScript();
        }
    }
}
