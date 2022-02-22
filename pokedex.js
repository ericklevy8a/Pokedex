/**
 * Pokedex API inteface in JS
 */

const pokeApiUrl = 'https://pokeapi.co/api/v2/';

var giPageSize = 12;
var giPageNum = 0;

var giPokeCount = null;

const pageContainer = document.getElementById('pokedex-container');

/**
 * pokeFetchPage
 * @param {integer} pageNum     The number of page to fetch to calculate the offset
 * @param {integer} pageSize    The limit size of the page (also to calculate the offset)
 * @returns JSON data with the response of the poke API web fetching
 */
async function pokeFetchPage(pageNum = giPageNum, pageSize = giPageSize) {
    let limit = pageSize;
    let offset = pageNum * pageSize;
    const url = pokeApiUrl + `pokemon?limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

async function pokeFetchAll() {
    if (giPokeCount == undefined) {
        giPokeCount = await pokeGetPokemonCount();
    }
    const data = await pokeFetchPage(0, giPokeCount);
    return data;
}

async function pokeFetchPokemon(num = 1) {
    const url = pokeApiUrl + `pokemon/${num}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

async function pokeFetchUrl(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

async function pokeGetPokemonCount() {
    result = await pokeFetchPage(0, 1);
    return result.count || false;
}

// Fetch all the pokemons names and urls in the pokedex and generate simple cards
pokeFetchAll().then(data => {
    var elements = data.results;
    elements.forEach(element => {
        let card = document.createElement('article');
        card.classList.add('card-mini');
        card.dataset.name = element.name;
        card.dataset.url = element.url;
        pageContainer.appendChild(card);
        observer.observe(card);
    });
});

//
//  INTERSECTION OBSERVER
//

// Options for the observer
const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
}

// Callback function for the observer
var intersectionCallback = function (entries, observer) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            let target = entry.target;
            // Fetch one time only to optimize (when data is undefined)
            if (target.data == undefined) {
                // Fetch the pokemon data
                pokeFetchUrl(target.dataset.url).then(data => {
                    target.data = data;
                    let id = data.id;
                    let imageUrl = data.sprites.front_default || './img/null.png';
                    let name = prepareTitle(data.name);

                    let head = document.createElement('div');
                    head.classList.add('head');

                    // Type dependent colors
                    let types = [];
                    [...data.types].forEach(type => types.push(type.type.name));
                    let color = typesColors[types[0]];
                    head.innerHTML += `<span class="circle" title="${types[0]}" style="background-color:${color}">&nbsp;</span>`;
                    if (types.length > 1) {
                        let color2 = typesColors[types[1]];
                        head.innerHTML += `<span class="circle" title="${types[1]}" style="background-color:${color2}">&nbsp;</span>`;
                    }
                    head.innerHTML += `<span class="expanded right">${id}</span>`;
                    target.appendChild(head);

                    target.innerHTML += `<img src="${imageUrl}" onerror="this.style.display='none'"/>`;
                    target.innerHTML += `<label title="${name}">${name}</label>`;

                    // Set a click event listener
                    target.addEventListener('click', pokeCardOnClick);
                });
            }
        }
    });
}

// Create a instance of IntersectionObserver
var observer = new IntersectionObserver(intersectionCallback, options);

// Handler for card click event
function pokeCardOnClick(event) {
    let data = event.currentTarget.data;
    cardboxOpen(data);
}

//
// CODE FOR MODAL DIALOGS
//

/**
 * Modal message box dialog.
 *
 * Displays a message in a modal dialog box, waits for the user to click a button,
 * and send the button click event to the function especified to process the user choice.
 *
 * NOTE: The msgboxClose function need to be called to close the dialog box.
 *
 * Parameters:
 * @param {string} titleText    Required. String expression to display as a header.
 * @param {string} msgText      Required. String expression with the main meesage.
 * @param {array} arrActions    Optional. String or array of strings with the label
 *                              of the buttons to display. If omited, only an Ok button
 *                              will be displayed.
 * @param {function} titleText  A lambda function to process the buttons click event.
 *                              If omitted, the msgboxClose function will be called.
 */
function msgbox(title, text, arrActions = strings.btnOk || 'Ok', fnOnClick = msgboxClose) {
    const modalScreen = document.getElementById('modal-screen');
    const msgbox = document.getElementById('msgbox');
    const msgboxTitleClose = document.getElementById('msgbox-title-close');
    const msgboxTitle = document.getElementById('msgbox-title');
    const msgboxText = document.getElementById('msgbox-text');
    const msgboxButtons = document.getElementById('msgbox-buttons');
    // Close dialog handlers
    msgboxTitleClose.addEventListener('click', msgboxClose);
    document.addEventListener('keyup', document.keyupfn = function (e) { if (e.code == 'Escape') msgboxClose() });
    // Displat texts in title and message
    msgboxTitle.textContent = title;
    msgboxText.innerHTML = text;
    // Force the parameter for button(s) to an array
    if (!Array.isArray(arrActions)) {
        arrActions = [arrActions];
    }
    // Empty the button(s) container tag and...
    msgboxButtons.innerHTML = '';
    // ...fill it again with all the new buttons
    arrActions.forEach(element => {
        let button = document.createElement('button');
        button.innerText = element;
        button.addEventListener('click', fnOnClick);
        msgboxButtons.appendChild(button);
    });
    // Unhide modal screen and box
    modalScreen.style.display = 'block';
    msgbox.style.display = 'block';
    modalScreen.classList.add('show');
    msgbox.classList.add('show');
}

function msgboxClose() {
    const modalScreen = document.getElementById('modal-screen');
    const msgbox = document.getElementById('msgbox');
    document.removeEventListener('keyup', document.keyupfn);
    // Hide modal screen and box
    msgbox.classList.remove('show');
    modalScreen.classList.remove('show');
    setTimeout(() => {
        modalScreen.style.display = 'none';
        msgbox.style.display = 'none';
    }, 500);
}

/**
 * Modal configuration box dialog.
 *
 * Displays a configuration modal dialog box, call the update and display options functions,
 * and let the user change settings.
 */
function cardboxOpen(data) {
    const modalScreen = document.getElementById('modal-screen');
    const cardbox = document.getElementById('cardbox');
    const cardboxTitleClose = document.getElementById('cardbox-title-close');
    cardbox.data = data;
    // Close dialog handlers
    cardboxTitleClose.addEventListener('click', cardboxClose);
    document.addEventListener('keyup', document.keyupfn = function (e) { if (e.code == 'Escape') cardboxClose() });
    // Update and display options
    cardboxDisplayData(data);
    // Unhide modal screen and box
    modalScreen.style.display = 'block';
    cardbox.style.display = 'block';
    modalScreen.classList.add('show');
    cardbox.classList.add('show');
}

function cardboxDisplayData(data) {
    const cardboxContainer = document.getElementById('cardbox-content');

    console.log(data);

    cardboxContainer.data = data;
    // Id and Name
    const cardboxTitle = document.getElementById('cardbox-title');
    cardboxTitle.innerText = data.id + ' ' + prepareTitle(data.name);
    // Sprites
    cardboxUpdateSprites();
    // Size
    const sizeWeight = document.getElementById('size-weight');
    const sizeHeight = document.getElementById('size-height');
    sizeWeight.innerHTML = '<b>' + data.weight / 10 + ' kg</b>';
    sizeHeight.innerHTML = '<b>' + data.height / 10 + ' m</b>';
    // Types and damage relations
    cardboxUpdateTypes();
    // Abilities
    // Stats
    // Etc
}

function cardboxUpdateSprites() {
    const cardboxContainer = document.getElementById('cardbox-content');
    let sprites = cardboxContainer.data.sprites;
    const imageSprite = document.getElementById('image-sprite');
    const checkBack = document.getElementById('check-back');
    const checkShiny = document.getElementById('check-shiny');
    const checkFemale = document.getElementById('check-female');
    // Select image
    let selKey = 'front_default';
    selKey = checkBack.checked ? 'back' : 'front';
    selKey += checkShiny.checked ? '_shiny' : '';
    selKey += checkFemale.checked ? '_female' : (checkShiny.checked ? '' : '_default');
    let url = sprites[selKey];
    if (url && typeof (url) === 'string') {
        imageSprite.title = selKey;
        imageSprite.src = sprites[selKey];
    }
    // Event listeners
    checkBack.addEventListener('change', cardboxUpdateSprites);
    checkFemale.addEventListener('change', cardboxUpdateSprites);
    checkShiny.addEventListener('change', cardboxUpdateSprites);
}

const typesColors = {
    normal: '#A8A878',
    fire: '#F08030',
    water: '#6890F0',
    electric: '#F8D030',
    grass: '#78C850',
    ice: '#98D8D8',
    fighting: '#C03028',
    poison: '#A040A0',
    ground: '#E0C068',
    flying: '#A890F0',
    psychic: '#F85888',
    bug: '#A8B820',
    rock: '#B8A038',
    ghost: '#705898',
    dragon: '#7038F8',
    dark: '#705848',
    steel: '#B8B8D0',
    fairy: '#EE99AC',
};

function cardboxUpdateTypes() {
    const cardboxContainer = document.getElementById('cardbox-content');
    const typesTabsContainer = document.getElementById('types-tabs-container');
    const typesTabsHeader = document.getElementById('types-tabs-header');
    const typesTabs = document.getElementById('types-tabs');
    let types = [...cardboxContainer.data.types];
    console.log(types);
    typesTabsHeader.innerHTML = '';
    typesTabs.innerHTML = '';
    types.forEach(slot => {
        // Tab header
        let header = document.createElement('li');
        header.classList.add('type-slot');
        header.style.backgroundColor = typesColors[slot.type.name];
        header.innerText = prepareTitle(slot.type.name);
        typesTabsHeader.appendChild(header);
        // Tab body
        let body = document.createElement('div');
        body.classList.add('tabify-tab');
        body.dataset.url = slot.type.url;
        body.style.borderColor = typesColors[slot.type.name];
        typesTabs.appendChild(body);
    });
    tabify(typesTabsContainer);
}

function cardboxClose() {
    const modalScreen = document.getElementById('modal-screen');
    const cardbox = document.getElementById('cardbox');
    document.removeEventListener('keyup', document.keyupfn);
    // Hide modal screen and box
    modalScreen.classList.remove('show');
    cardbox.classList.remove('show');
    setTimeout(() => {
        modalScreen.style.display = 'none';
        cardbox.style.display = 'none';
    }, 500);
}

function tabLoadContent(element) {
    if (element.innerHTML == '') {
        element.innerHTML = element.dataset.url;
        let data = pokeFetchUrl(element.dataset.url);
        console.log(data);
        let html = '';


    }
}

//
// TABIFY TABS IMPLEMENTATION
//

function tabify(element) {
    const header = element.querySelector('.tabify-tabs-header');
    const content = element.querySelector('.tabify-tabs');
    const tab_headers = [...header.children];
    const tab_contents = [...content.children];
    tab_contents.forEach(x => x.style.display = 'none');
    let current_tab_index = -1;

    function setTab(index) {
        if (current_tab_index > -1) {
            tab_headers[current_tab_index].classList.remove('current');
            tab_contents[current_tab_index].style.display = 'none';
        }
        if (current_tab_index !== index) {
            tabLoadContent(tab_contents[index]);
            tab_headers[index].classList.add('current');
            tab_contents[index].style.display = 'flex';
            current_tab_index = index;
        } else {
            current_tab_index = -1;
        }
    }

    default_tab_index = tab_headers.findIndex(x => {
        return [...x.classList].indexOf('tabify-default') > -1;
    });
    //default_tab_index = default_tab_index === -1 ? 0 : default_tab_index;
    setTab(default_tab_index);
    tab_headers.forEach((x, i) => x.onclick = event => setTab(i));
}

// this is where the magic happens!
//   [...document.querySelectorAll('.gator-tabs-container')]
//     .forEach(x => tabify(x));

//
// SOME UTIL FUNCTIONS
//

function capitalize(str) {
    return str[0].toUpperCase() + str.substring(1);
}

function prepareTitle(str) {
    let tokens = str.split('-');
    str = '';
    tokens.forEach((token, index, array) => {
        array[index] = capitalize(token);
    });
    return tokens.join(' ');
}

// End of code.