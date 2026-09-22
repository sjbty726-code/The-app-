"use strict";

/* =====================================================
   ود فيصل VIP
   API-FOOTBALL
===================================================== */

const API_KEY =
"a4c2934c4adb9f2d14d0acc2e970cca6";

const API_URL =
"https://v3.football.api-sports.io";

const TIMEZONE =
"Africa/Khartoum";


/* =====================================================
   حالة التطبيق
===================================================== */

let matches = [];
let currentFilter = "all";
let searchText = "";
let autoRefresh = true;
let refreshTimer = null;


/* =====================================================
   البداية
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    startSplash();

    setupNavigation();

    setupFilters();

    setupSearch();

    setupSettings();

    setupRating();

    setupTheme();

    startAutoRefresh();

});


/* =====================================================
   SPLASH
===================================================== */

function startSplash(){

    let count = 3;

    const element =
    document.getElementById("splashCount");

    const timer =
    setInterval(() => {

        count--;

        if(count > 0){
            element.textContent = count;
        }

        if(count <= 0){

            clearInterval(timer);

            setTimeout(() => {

                document
                .getElementById("splash")
                .classList.add("hide");

                document
                .getElementById("app")
                .classList.remove("hidden");

            },400);

        }

    },1000);

}


/* =====================================================
   NAVIGATION
===================================================== */

function setupNavigation(){

    document
    .querySelectorAll(".nav-item")
    .forEach(button => {

        button.addEventListener("click", () => {

            openPage(
                button.dataset.page
            );

        });

    });

}


function openPage(pageId){

    document
    .querySelectorAll(".page")
    .forEach(page => {

        page.classList.add("hidden");

    });


    const page =
    document.getElementById(pageId);

    if(!page) return;

    page.classList.remove("hidden");


    document
    .querySelectorAll(".nav-item")
    .forEach(item => {

        item.classList.toggle(
            "active",
            item.dataset.page === pageId
        );

    });


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });


    if(pageId === "footballPage"){

        if(matches.length === 0){

            loadMatches();

        }

    }


    if(pageId === "resultsPage"){

        renderResults();

    }

}


/* =====================================================
   API
===================================================== */

async function apiFetch(endpoint){

    const response =
    await fetch(
        API_URL + endpoint,
        {
            method:"GET",
            headers:{
                "x-apisports-key":API_KEY,
                "Accept":"application/json"
            }
        }
    );


    let data = null;

    try{
        data = await response.json();
    }
    catch{
        throw new Error(
            "استجابة غير صالحة من الخادم"
        );
    }


    if(!response.ok){

        throw new Error(
            data?.message ||
            `HTTP ${response.status}`
        );

    }


    if(
        data.errors &&
        Object.keys(data.errors).length
    ){

        throw new Error(
            Object.values(data.errors)[0]
        );

    }


    return data;

}


/* =====================================================
   تاريخ السودان
===================================================== */

function today(){

    const parts =
    new Intl.DateTimeFormat(
        "en-GB",
        {
            timeZone:TIMEZONE,
            year:"numeric",
            month:"2-digit",
            day:"2-digit"
        }
    ).formatToParts(new Date());


    const value = {};

    parts.forEach(part => {

        if(part.type !== "literal"){
            value[part.type] = part.value;
        }

    });


    return `${value.year}-${value.month}-${value.day}`;

}


/* =====================================================
   وقت السودان
===================================================== */

function khartoumTime(){

    return new Intl.DateTimeFormat(
        "ar-SD",
        {
            timeZone:TIMEZONE,
            hour:"2-digit",
            minute:"2-digit"
        }
    ).format(new Date());

}


/* =====================================================
   تحميل المباريات
===================================================== */

async function loadMatches(){

    showLoading();

    setApiStatus(
        "جاري تحديث المباريات...",
        "loading"
    );


    try{

        const data =
        await apiFetch(
            `/fixtures?date=${today()}&timezone=${TIMEZONE}`
        );


        matches =
        Array.isArray(data.response)
        ? data.response
        : [];


        updateStats();

        renderMatches();

        renderResults();


        document
        .getElementById("lastUpdate")
        .textContent =
        khartoumTime();


        setApiStatus(
            `متصل • ${matches.length} مباراة`,
            "online"
        );


    }
    catch(error){

        console.error(error);

        document
        .getElementById("errorText")
        .textContent =
        error.message ||
        "تعذر الاتصال بخدمة المباريات";


        document
        .getElementById("loadingBox")
        .classList.add("hidden");


        document
        .getElementById("errorBox")
        .classList.remove("hidden");


        setApiStatus(
            "تعذر الاتصال",
            "error"
        );

    }

}


/* =====================================================
   حالة API
===================================================== */

function setApiStatus(text,type){

    document
    .getElementById("apiText")
    .textContent = text;


    const dot =
    document.getElementById("apiDot");


    dot.className = "";

    if(type === "online"){
        dot.classList.add("online");
    }

    if(type === "error"){
        dot.classList.add("error");
    }

}


/* =====================================================
   Loading
===================================================== */

function showLoading(){

    document
    .getElementById("loadingBox")
    .classList.remove("hidden");


    document
    .getElementById("errorBox")
    .classList.add("hidden");


    document
    .getElementById("emptyBox")
    .classList.add("hidden");

}


/* =====================================================
   نوع المباراة
===================================================== */

function matchType(match){

    const status =
    match?.fixture?.status?.short || "";


    const live = [
        "1H",
        "HT",
        "2H",
        "ET",
        "BT",
        "P",
        "LIVE"
    ];


    const finished = [
        "FT",
        "AET",
        "PEN"
    ];


    if(live.includes(status)){
        return "live";
    }


    if(finished.includes(status)){
        return "finished";
    }


    return "upcoming";

}


/* =====================================================
   حالة عربية
===================================================== */

function statusArabic(match){

    const status =
    match?.fixture?.status?.short || "";

    const minute =
    match?.fixture?.status?.elapsed;


    if(
        status === "1H" ||
        status === "2H" ||
        status === "ET"
    ){

        return minute
        ? `مباشر ${minute}'`
        : "مباشر";

    }


    if(status === "HT"){
        return "استراحة";
    }


    if(status === "BT"){
        return "وقت إضافي";
    }


    if(status === "P"){
        return "ركلات ترجيح";
    }


    if(
        status === "FT" ||
        status === "AET" ||
        status === "PEN"
    ){

        return "انتهت";

    }


    if(status === "PST"){
        return "مؤجلة";
    }


    if(status === "CANC"){
        return "ملغاة";
    }


    if(status === "SUSP"){
        return "موقوفة";
    }


    return "قادمة";

}


/* =====================================================
   وقت المباراة
===================================================== */

function matchTime(match){

    if(!match?.fixture?.date){
        return "--:--";
    }


    return new Intl.DateTimeFormat(
        "ar-SD",
        {
            timeZone:TIMEZONE,
            hour:"2-digit",
            minute:"2-digit"
        }
    ).format(
        new Date(match.fixture.date)
    );

}


/* =====================================================
   تحديث الإحصائيات
===================================================== */

function updateStats(){

    document
    .getElementById("totalMatches")
    .textContent =
    matches.length;


    const live =
    matches.filter(
        item =>
        matchType(item) === "live"
    ).length;


    document
    .getElementById("liveMatches")
    .textContent = live;


    const leagues =
    new Set(
        matches.map(
            item => item?.league?.name
        )
        .filter(Boolean)
    );


    document
    .getElementById("leagueCount")
    .textContent =
    leagues.size;

}


/* =====================================================
   الفلاتر
===================================================== */

function setupFilters(){

    document
    .querySelectorAll(".filter")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                .querySelectorAll(".filter")
                .forEach(item => {
                    item.classList.remove("active");
                });


                button.classList.add("active");


                currentFilter =
                button.dataset.filter;


                renderMatches();

            }
        );

    });

}


/* =====================================================
   البحث
===================================================== */

function setupSearch(){

    const input =
    document.getElementById(
        "searchInput"
    );


    input.addEventListener(
        "input",
        () => {

            searchText =
            input.value
            .trim()
            .toLowerCase();


            renderMatches();

        }
    );

}


/* =====================================================
   فلترة
===================================================== */

function filteredMatches(){

    let result =
    [...matches];


    if(currentFilter !== "all"){

        result =
        result.filter(
            item =>
            matchType(item) === currentFilter
        );

    }


    if(searchText){

        result =
        result.filter(item => {

            const home =
            item?.teams?.home?.name || "";

            const away =
            item?.teams?.away?.name || "";

            const league =
            item?.league?.name || "";


            return (
                home.toLowerCase().includes(searchText) ||
                away.toLowerCase().includes(searchText) ||
                league.toLowerCase().includes(searchText)
            );

        });

    }


    result.sort((a,b) => {

        const priority = {
            live:0,
            upcoming:1,
            finished:2
        };


        const aType =
        matchType(a);

        const bType =
        matchType(b);


        if(
            priority[aType] !==
            priority[bType]
        ){

            return (
                priority[aType] -
                priority[bType]
            );

        }


        return new Date(
            a.fixture.date
        ) - new Date(
            b.fixture.date
        );

    });


    return result;

}


/* =====================================================
   عرض المباريات
===================================================== */

function renderMatches(){

    const container =
    document.getElementById(
        "matchesContainer"
    );


    container.innerHTML = "";


    const result =
    filteredMatches();


    if(result.length === 0){

        document
        .getElementById("emptyBox")
        .classList.remove("hidden");

        return;

    }


    document
    .getElementById("emptyBox")
    .classList.add("hidden");


    result.forEach(
        (match,index) => {

            container.appendChild(
                createMatchCard(
                    match,
                    index
                )
            );

        }
    );

}


/* =====================================================
   كرت المباراة
===================================================== */

function createMatchCard(match,index){

    const article =
    document.createElement("article");


    const type =
    matchType(match);


    article.className =
    `match-card ${type}`;


    article.style.animationDelay =
    `${Math.min(index*30,400)}ms`;


    const home =
    match?.teams?.home;

    const away =
    match?.teams?.away;


    const homeGoals =
    match?.goals?.home;

    const awayGoals =
    match?.goals?.away;


    const score =
    type === "upcoming"
    ? "VS"
    : `${homeGoals ?? 0} - ${awayGoals ?? 0}`;


    const venue =
    match?.fixture?.venue?.name || "";


    article.innerHTML = `

        <div class="match-top">

            <span class="league">
                🏆 ${esc(match?.league?.name || "بطولة")}
            </span>

            <span class="status ${type}">
                ${esc(statusArabic(match))}
            </span>

        </div>


        <div class="match-main">

            <div>

                <img
                    class="team-logo"
                    src="${safeUrl(home?.logo)}"
                    onerror="this.style.display='none'"
                >

                <span class="team-name">
                    ${esc(home?.name || "الفريق الأول")}
                </span>

            </div>


            <div>

                <span class="score">
                    ${esc(score)}
                </span>

                <span class="match-time">
                    ${esc(matchTime(match))}
                </span>

            </div>


            <div>

                <img
                    class="team-logo"
                    src="${safeUrl(away?.logo)}"
                    onerror="this.style.display='none'"
                >

                <span class="team-name">
                    ${esc(away?.name || "الفريق الثاني")}
                </span>

            </div>

        </div>


        <div class="match-bottom">

            <span>
                ${esc(match?.league?.country || "")}
            </span>

            <span>
                ${esc(venue)}
            </span>

        </div>


        <button
            class="details-btn"
            data-id="${Number(match?.fixture?.id || 0)}"
        >
            ✦ فتح تفاصيل المباراة
        </button>

    `;


    article
    .querySelector(".details-btn")
    .addEventListener(
        "click",
        () => {

            openMatch(
                Number(
                    match?.fixture?.id
                )
            );

        }
    );


    return article;

}


/* =====================================================
   النتائج
===================================================== */

function renderResults(){

    const container =
    document.getElementById(
        "resultsContainer"
    );


    if(!container) return;


    const result =
    matches.filter(
        item =>
        matchType(item) === "finished"
    );


    container.innerHTML = "";


    if(result.length === 0){

        container.innerHTML = `

            <div class="message-box">

                <div>🏆</div>

                <h3>
                    لا توجد نتائج مكتملة
                </h3>

                <p>
                    ستظهر هنا نتائج مباريات اليوم.
                </p>

            </div>

        `;

        return;

    }


    result.forEach(
        (match,index) => {

            container.appendChild(
                createMatchCard(
                    match,
                    index
                )
            );

        }
    );

}


/* =====================================================
   تفاصيل المباراة
===================================================== */

async function openMatch(id){

    if(!id) return;


    const modal =
    document.getElementById(
        "matchModal"
    );


    const content =
    document.getElementById(
        "matchDetailsContent"
    );


    modal.classList.remove(
        "hidden"
    );


    content.innerHTML = `

        <div class="message-box">

            <div class="spinner"></div>

            <h3>
                جاري تحميل تفاصيل المباراة
            </h3>

            <p>
                الملخص والتشكيلات والإحصائيات...
            </p>

        </div>

    `;


    try{

        /*
          طلب واحد للتفاصيل.
          API-Football يعيد عند توفرها:
          events + lineups + statistics + players
        */

        const data =
        await apiFetch(
            `/fixtures?id=${id}`
        );


        const fixture =
        data?.response?.[0];


        if(!fixture){
            throw new Error(
                "لم يتم العثور على تفاصيل المباراة"
            );
        }


        renderMatchDetails(
            fixture
        );

    }
    catch(error){

        content.innerHTML = `

            <div class="message-box">

                <div>⚠️</div>

                <h3>
                    تعذر تحميل التفاصيل
                </h3>

                <p>
                    ${esc(error.message)}
                </p>

            </div>

        `;

    }

}


/* =====================================================
   عرض التفاصيل
===================================================== */

function renderMatchDetails(fixture){

    const content =
    document.getElementById(
        "matchDetailsContent"
    );


    const home =
    fixture?.teams?.home;

    const away =
    fixture?.teams?.away;


    const type =
    matchType(fixture);


    const score =
    type === "upcoming"
    ? "VS"
    : `${fixture?.goals?.home ?? 0} - ${fixture?.goals?.away ?? 0}`;


    content.innerHTML = `

        <div class="detail-header">

            <span class="league">
                🏆 ${esc(
                    fixture?.league?.name || ""
                )}
            </span>


            <div class="detail-teams">

                <div>

                    <img
                        class="detail-logo"
                        src="${safeUrl(home?.logo)}"
                    >

                    <span class="detail-team-name">
                        ${esc(home?.name || "")}
                    </span>

                </div>


                <div>

                    <div class="detail-score">
                        ${esc(score)}
                    </div>

                    <div class="detail-status">
                        ${esc(statusArabic(fixture))}
                    </div>

                </div>


                <div>

                    <img
                        class="detail-logo"
                        src="${safeUrl(away?.logo)}"
                    >

                    <span class="detail-team-name">
                        ${esc(away?.name || "")}
                    </span>

                </div>

            </div>

        </div>


        <div class="detail-tabs">

            <button
                class="detail-tab active"
                data-detail="summary"
            >
                الملخص
            </button>

            <button
                class="detail-tab"
                data-detail="events"
            >
                الأحداث
            </button>

            <button
                class="detail-tab"
                data-detail="lineups"
            >
                التشكيلات
            </button>

            <button
                class="detail-tab"
                data-detail="stats"
            >
                الإحصائيات
            </button>

        </div>


        <div
            id="detailContent"
            class="detail-content"
        ></div>

    `;


    const detailData = {

        summary: fixture,

        events:
        fixture?.events || [],

        lineups:
        fixture?.lineups || [],

        stats:
        fixture?.statistics || []

    };


    renderDetailTab(
        "summary",
        detailData
    );


    document
    .querySelectorAll(".detail-tab")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                .querySelectorAll(".detail-tab")
                .forEach(item => {
                    item.classList.remove("active");
                });


                button.classList.add(
                    "active"
                );


                renderDetailTab(
                    button.dataset.detail,
                    detailData
                );

            }
        );

    });

}


/* =====================================================
   تبويبات التفاصيل
===================================================== */

function renderDetailTab(type,data){

    const box =
    document.getElementById(
        "detailContent"
    );


    if(type === "summary"){

        const f = data.summary;


        box.innerHTML = `

            <div class="detail-box">

                <h3>📋 ملخص المباراة</h3>

                <p>
                    ${esc(
                        f?.league?.name || ""
                    )}
                </p>

                <p>
                    🏟
                    ${esc(
                        f?.fixture?.venue?.name ||
                        "الملعب غير متوفر"
                    )}
                </p>

                <p>
                    📅
                    ${esc(matchTime(f))}
                </p>

                <p>
                    🎯
                    ${esc(statusArabic(f))}
                </p>

            </div>


            <div class="detail-box">

                <h3>⚽ الأهداف</h3>

                <p>
                    ${esc(
                        goalSummary(f)
                    )}
                </p>

            </div>

        `;

        return;

    }


    if(type === "events"){

        renderEvents(
            data.events,
            box
        );

        return;

    }


    if(type === "lineups"){

        renderLineups(
            data.lineups,
            box
        );

        return;

    }


    if(type === "stats"){

        renderStats(
            data.stats,
            box
        );

    }

}


/* =====================================================
   ملخص الأهداف
===================================================== */

function goalSummary(fixture){

    const home =
    fixture?.teams?.home?.name || "الفريق الأول";

    const away =
    fixture?.teams?.away?.name || "الفريق الثاني";


    const homeGoals =
    fixture?.goals?.home;

    const awayGoals =
    fixture?.goals?.away;


    if(
        homeGoals === null ||
        awayGoals === null ||
        typeof homeGoals === "undefined" ||
        typeof awayGoals === "undefined"
    ){

        return "لم تبدأ المباراة بعد.";

    }


    return `${home}: ${homeGoals} — ${away}: ${awayGoals}`;

}


/* =====================================================
   الأحداث
===================================================== */

function renderEvents(events,box){

    if(!events.length){

        box.innerHTML = `

            <div class="detail-box">

                <h3>🕘 أحداث المباراة</h3>

                <p>
                    لا توجد أحداث متاحة حالياً.
                </p>

            </div>

        `;

        return;

    }


    const html =
    events.map(event => {

        let icon = "•";


        if(event.type === "Goal"){
            icon = "⚽";
        }

        if(event.type === "Card"){
            icon = "🟨";
        }

        if(
            event.detail &&
            event.detail.toLowerCase()
            .includes("red")
        ){
            icon = "🟥";
        }

        if(event.type === "subst"){
            icon = "🔄";
        }


        const minute =
        event?.time?.extra
        ? `${event.time.elapsed}+${event.time.extra}'`
        : `${event?.time?.elapsed ?? ""}'`;


        return `

            <div class="event-row">

                <span class="minute">
                    ${esc(minute)}
                </span>

                <span>
                    ${icon}
                </span>

                <span>
                    ${esc(
                        event?.player?.name ||
                        event?.detail ||
                        event?.type ||
                        ""
                    )}
                </span>

            </div>

        `;

    }).join("");


    box.innerHTML = `

        <div class="detail-box">

            <h3>🕘 أحداث المباراة</h3>

            ${html}

        </div>

    `;

}


/* =====================================================
   التشكيلات
===================================================== */

function renderLineups(lineups,box){

    if(!lineups.length){

        box.innerHTML = `

            <div class="detail-box">

                <h3>📋 التشكيلات</h3>

                <p>
                    التشكيلات غير متوفرة بعد.
                </p>

            </div>

        `;

        return;

    }


    box.innerHTML =
    lineups.map(team => {

        const players =
        team?.startXI || [];


        const bench =
        team?.substitutes || [];


        const playerHTML =
        players.map(item => {

            const player =
            item?.player;


            return `

                <div class="player">

                    <span>
                        ${esc(
                            player?.number ?? ""
                        )}
                        -
                        ${esc(
                            player?.name || ""
                        )}
                    </span>

                    <span>
                        ${esc(
                            player?.pos || ""
                        )}
                    </span>

                </div>

            `;

        }).join("");


        return `

            <div class="lineup-team">

                <div class="lineup-head">

                    <b>
                        ${esc(
                            team?.team?.name || ""
                        )}
                    </b>

                    <span class="formation">
                        ${esc(
                            team?.formation ||
                            "غير متوفر"
                        )}
                    </span>

                </div>


                <h4>
                    التشكيلة الأساسية
                </h4>

                ${playerHTML || "<p>غير متوفرة</p>"}


                <div style="margin-top:12px">

                    <h4>
                        البدلاء
                    </h4>

                    ${bench
                    .slice(0,12)
                    .map(item => {

                        return `

                            <div class="player">

                                <span>
                                    ${esc(
                                        item?.player?.name || ""
                                    )}
                                </span>

                                <span>
                                    بديل
                                </span>

                            </div>

                        `;

                    }).join("")}

                </div>

            </div>

        `;

    }).join("");

}


/* =====================================================
   الإحصائيات
===================================================== */

function renderStats(stats,box){

    if(!stats.length){

        box.innerHTML = `

            <div class="detail-box">

                <h3>📊 إحصائيات المباراة</h3>

                <p>
                    الإحصائيات غير متوفرة حالياً.
                </p>

            </div>

        `;

        return;

    }


    const home =
    stats[0] || {};

    const away =
    stats[1] || {};


    const map = new Map();


    (home.statistics || [])
    .forEach(item => {

        map.set(
            item.type,
            {
                home:item.value,
                away:null
            }
        );

    });


    (away.statistics || [])
    .forEach(item => {

        if(!map.has(item.type)){

            map.set(
                item.type,
                {
                    home:null,
                    away:item.value
                }
            );

        }
        else{

            map.get(item.type).away =
            item.value;

        }

    });


    const interesting = [

        "Ball Possession",
        "Total Shots",
        "Shots on Goal",
        "Shots off Goal",
        "Corner Kicks",
        "Fouls",
        "Offsides",
        "Yellow Cards",
        "Red Cards"

    ];


    const rows =
    interesting
    .filter(type => map.has(type))
    .map(type => {

        const values =
        map.get(type);


        const h =
        numberValue(values.home);

        const a =
        numberValue(values.away);


        const total =
        h + a || 1;


        const homeWidth =
        Math.max(
            5,
            Math.min(
                95,
                (h / total) * 100
            )
        );


        const awayWidth =
        Math.max(
            5,
            Math.min(
                95,
                (a / total) * 100
            )
        );


        return `

            <div class="stat-line">

                <div class="stat-title">

                    <span>
                        ${esc(
                            values.home ?? "-"
                        )}
                    </span>

                    <b>
                        ${esc(type)}
                    </b>

                    <span>
                        ${esc(
                            values.away ?? "-"
                        )}
                    </span>

                </div>


                <div class="stat-bars">

                    <div
                        class="stat-home"
                        style="width:${homeWidth}%"
                    ></div>

                    <div
                        class="stat-away"
                        style="width:${awayWidth}%"
                    ></div>

                </div>

            </div>

        `;

    }).join("");


    box.innerHTML = `

        <div class="detail-box">

            <h3>📊 إحصائيات المباراة</h3>

            ${rows || "لا توجد إحصائيات"}

        </div>

    `;

}


/* =====================================================
   رقم الإحصائية
===================================================== */

function numberValue(value){

    if(value === null ||
       typeof value === "undefined"){
        return 0;
    }


    const number =
    parseFloat(
        String(value)
        .replace("%","")
    );


    return Number.isFinite(number)
    ? number
    : 0;

}


/* =====================================================
   إغلاق التفاصيل
===================================================== */

function closeMatch(){

    document
    .getElementById("matchModal")
    .classList.add("hidden");

}


/* =====================================================
   التحديث التلقائي
===================================================== */

function startAutoRefresh(){

    if(refreshTimer){
        clearInterval(refreshTimer);
    }


    refreshTimer =
    setInterval(() => {

        if(autoRefresh){

            const football =
            document.getElementById(
                "footballPage"
            );


            if(
                football &&
                !football.classList.contains("hidden")
            ){

                loadMatches();

            }

        }

    },10 * 60 * 1000);

}


/* =====================================================
   الإعدادات
===================================================== */

function setupSettings(){

    const auto =
    document.getElementById(
        "autoToggle"
    );


    const dark =
    document.getElementById(
        "darkToggle"
    );


    const effects =
    document.getElementById(
        "effectsToggle"
    );


    auto.addEventListener(
        "change",
        () => {

            autoRefresh =
            auto.checked;

            localStorage.setItem(
                "wd_auto",
                autoRefresh
            );

        }
    );


    dark.addEventListener(
        "change",
        () => {

            document.body.classList.toggle(
                "light-mode",
                !dark.checked
            );

        }
    );


    effects.addEventListener(
        "change",
        () => {

            document.body.classList.toggle(
                "no-effects",
                !effects.checked
            );

        }
    );


    const saved =
    localStorage.getItem("wd_auto");


    if(saved !== null){

        autoRefresh =
        saved === "true";

        auto.checked =
        autoRefresh;

    }

}


/* =====================================================
   الثيم
===================================================== */

function setupTheme(){

    const button =
    document.getElementById(
        "themeBtn"
    );


    button.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "soft-theme"
            );


            button.textContent =
            document.body.classList.contains(
                "soft-theme"
            )
            ? "☀"
            : "☾";

        }
    );

}


/* =====================================================
   التقييم
===================================================== */

function setupRating(){

    const stars =
    document.querySelectorAll(
        ".stars button"
    );


    stars.forEach(star => {

        star.addEventListener(
            "click",
            () => {

                const rate =
                Number(
                    star.dataset.rate
                );


                stars.forEach(item => {

                    item.classList.toggle(
                        "active",
                        Number(
                            item.dataset.rate
                        ) <= rate
                    );

                });


                document
                .getElementById(
                    "ratingMessage"
                )
                .textContent =
                `شكراً لك ⭐ تقييمك ${rate}/5`;

                localStorage.setItem(
                    "wd_rating",
                    rate
                );

            }
        );

    });


    const saved =
    Number(
        localStorage.getItem(
            "wd_rating"
        )
    );


    if(saved){

        stars.forEach(item => {

            item.classList.toggle(
                "active",
                Number(
                    item.dataset.rate
                ) <= saved
            );

        });


        document
        .getElementById(
            "ratingMessage"
        )
        .textContent =
        `تقييمك الحالي ${saved}/5 ⭐`;

    }

}


/* =====================================================
   تحديث يدوي
===================================================== */

document
.getElementById("refreshBtn")
.addEventListener(
    "click",
    loadMatches
);


/* =====================================================
   حماية HTML
===================================================== */

function esc(value){

    return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


/* =====================================================
   حماية روابط الصور
===================================================== */

function safeUrl(url){

    if(
        typeof url !== "string" ||
        !url.startsWith("https://")
    ){

        return "";

    }


    return url.replace(/"/g,"%22");

}
