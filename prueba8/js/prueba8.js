

var preloadObj = new Array(preload.length);
for (var i = 0; i < preload.length; i++)
{
    preloadObj[i] = new Image();
    preloadObj[i].src = preload[i];
}

function say(text)
{
    //caja1.text("message_container.innerHTML"); 
    //b.say(text);
    if(text == "lolo")
    {
        b.say(text);
        novel.ignoreClicks = true; //NO VA
    }
    novel.ignoreClicks = false; //NO VA
}

function sayOFF()
{
    message_container.innerHTML = "";
}
function boton()
{
    selfReply("boton");
}

function inicio()
{
    novel.frame = novel.labels['inventario'];
}

var script;



function prepareNovel()
{
    novel.imagePath = "images/"; 
    novel.audioPath = "audio/"; 


    n = new Character("guia",
        {
            color: "yellow"
        });

    b = new Character("BOT",
        {
            color: "pink"
        });
        

    caja1 = new TextBlock("centrado",
        {
        position: new Position(0.25,0.25), //asi se centra 
        width: 0.5, // ocupará la mitad (el 50% de la pantalla)
        color: "white", backgroundColor: "black",
        font: "24pt Helveltica", align: "center",
        border: "5px double yellow",
        text: "{{message_container.innerHTML}}",
        });

    pass = "click para continuar";   
    renglon = "<br>" ;

    input = new Input("name",
    {
        position: new Position(0.25,0.65), //centrado y cerca del dialogo
        width: 0.5,
        border: "3px solid red",
        text: "", align: "center",
    });
   
   
    script = [ 
        sub, "frame.2b", //CAJA
            n, " ",
            caja1, null,
        endSub, "",
        sub, "frame.2a", //PERSONAJE
            n, " ",
            n, "{{message_container.innerHTML}}",
        endSub, "",
        sub, "frame.2c", 
            jsCall, {fcn: sayOFF, params: []}, //1º BORRA
            call, "frame.2a", // 2º. SALTA DOS FRAMES
        endSub, "",

        sub, "input.ALL", 
            input, "",
            jsCall, {fcn: sayOFF, params: []},  
            call, "frame.2",
        endSub, "",
        sub, "input.ALL.2", //Para CAJA
            input, "",
            jsCall, {fcn: sayOFF, params: []}, 
            n, "",
           // call, "frame.2b", 
        endSub, "",

        sub, "input.SIMPLE", 
            input, "",
            jsCall, {fcn: sayOFF, params: []},  
        endSub, "",
////////////////////////////////////////////////////////////


        label, "start",
        menu, ["TP to..",
            "ritmo1", [jump, "ritmo1"],
            "ritmo2", [jump, "ritmo2"],
            "botones", [jump, "botones"]],

//            
        label, "ritmo1",
        n, "hola",
        jsCall, {fcn: selfReply, params: ["on"]},
        n, "despues de dejarme los sesos, creo que encontrado una formula",

        caja1, null,
        n, "ahora mismo estamos 3 elementos posibles en pantalla",
        n, "puedes hacer simple click en la pantalla... "+renglon+
        "Bueno...Si!!, Es tu única opción.. XD",
        n, "Pero...también podrian existir algunos botones interactivos en ese cuadro",
        n, "o incluso, en esta zona de dialogo",
        n, "por si fuera poco, existe una 4 forma..el Input!",

        call, "input.SIMPLE",
        n, "Muy bien!.. Acabas de enviar tu primer input..",

        caja1, null,
        n, "Viste?..Ese cuadro-espia leyó lo que escribiste! <br> "+
        "Adelante !, dile algo mas!", 

        call, "input.SIMPLE",
        n, "para conocer su respuesta, tan solo debes hacer click en la pantalla",

        caja1, null,
        n, "viste? sabe lo que le dices...",
        n, "te preguntarás si la única función que tiene es memorizar tu Input..",
        n, "la respuesta es NO, él es en realidad un BOT con cerebro artificial",
        n, "pero ya hablaremos de ésto mas adelante",

//      

        label, "ritmo2",
        n, "volviendo a la interacción entre tú, el input, el bot, la pantalla, y yo..",
        n, "se puede modificar ligeramente el ritmo",
        n, "por ejemplo, ahora estará mas sincronizado el momento ",
        call, "input.ALL.2",
        caja1, null,
        n, "viste?. Tanto el cuadro, como yo, hemos hablado al mismo tiempo",
        n, "precismamente, cuando terminaste de enviar tu input",
        n, "hay otras combinaciones, depende del efecto que se esté buscando",


//
        label, "botones",
        n, "ahora trataré el tema de los botoenes que te comenté antes..",
        n, "puedo mostrar una serie de botones como estos..n",
        n, "<button onclick='boton()'>ALGO</button> "+" <button onclick='selfReply()'>NADA</button>",
        caja1, null,
        n, "Viste?..Ahora es esa caja la que tiene un par de botones",
        n, "Al hacer click en alguno de ellos, podras ver el dialogo de un nuevo personaje",
        n, "pero es muy limitado, ya que solamente es para mostrartelo",
        


        label, "inventario",
        caja1, {visibility: "hidden"},
        n, "te diste cuenta?",
        n, "menos mal que tenia un botón para salir, sino.. hubieras quedado encerrado",
        n, "esta label, no está en el menu principal. ",


    ];
}

