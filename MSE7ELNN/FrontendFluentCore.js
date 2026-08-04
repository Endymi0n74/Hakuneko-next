import{D as e,E as t,O as n,R as r,T as i,f as a,j as o,k as ee,l as s,m as c,v as te}from"./InterProcessCommunication.js";import{$ as l,A as ne,B as re,C as u,D as d,E as f,F as p,G as m,H as h,I as ie,J as ae,K as g,L as oe,M as se,N as ce,O as le,P as ue,Q as _,R as de,S as fe,T as pe,U as v,V as me,W as y,X as b,Y as x,Z as S,_ as C,a as w,b as T,c as E,d as D,f as O,g as k,h as A,i as j,j as M,k as N,l as P,m as F,n as I,o as L,p as R,q as z,r as he,s as ge,t as _e,u as ve,v as ye,w as be,x as xe,y as Se,z as Ce}from"./Vendor.js";import{n as B}from"./DownloadTask.js";import{n as V,r as we,t as Te}from"./InteractiveFileContentProvider.js";var Ee=g`
    :host {
        box-shadow: var(--shadow4);
        border-radius: var(--borderRadiusLarge);
    }

    slot {
        display: content;
    }
`,De=y`<slot></slot>`,FluentCard=class extends z{};FluentCard.define({name:`fluent-card`,template:De,styles:Ee});var Oe=g`
    :host {
        display: contents;
    }
`,ke=y`
    <input ${m(`input`)} type="number" style="padding: 0.5em;" min=${e=>e.min} max=${e=>e.max} value=${e=>e.value.toString()} @change=${(e,t)=>e.DispatchChangeEvent()}></input>
`,FluentNumberField=class extends z{constructor(...e){super(...e),this.value=0}DispatchChangeEvent(){let e=Math.max(this.min,Math.min(this.max,parseInt(this.input.value)));if(e!=this.value){this.value=e;let t=new Event(`change`,{bubbles:!0,cancelable:!1,composed:!1});Object.defineProperty(t,"target",{value:this}),this.dispatchEvent(t)}}};V([x],FluentNumberField.prototype,`min`,void 0),V([x],FluentNumberField.prototype,`max`,void 0),V([x],FluentNumberField.prototype,`value`,void 0),FluentNumberField.define({name:`fluent-number-field`,template:ke,styles:Oe});var H={Scope:`frontend.fluent-core`,Theme:`theme`,PanelBookmarks:`panel.bookmarks`,PanelDownloads:`panel.downloads`},U={key:`web-dark`,value:re,label:r.Frontend_FluentCore_Settings_ThemeMode_WebDark},W={key:`web-light`,value:me,label:r.Frontend_FluentCore_Settings_ThemeMode_WebLight},G=new Map([[U.key,U],[W.key,W]]),SettingsManager=class{#e;#t;constructor(){this.#e=HakuNeko.SettingsManager.OpenScope(),this.#t=HakuNeko.SettingsManager.OpenScope(H.Scope),this.settingThemeChoice=new t(H.Theme,r.Frontend_FluentCore_Settings_ThemeMode_Label,r.Frontend_FluentCore_Settings_ThemeMode_Description,W.key,U,W),this.SettingSelectedTheme=G.get(this.settingThemeChoice.Value),this.settingPanelBookmarksCheck=new i(H.PanelBookmarks,r.Frontend_FluentCore_Settings_ShowBookmarksPanel_Label,r.Frontend_FluentCore_Settings_ShowBookmarksPanel_Description,!0),this.SettingPanelBookmarks=this.settingPanelBookmarksCheck.Value,this.settingPanelDownloadsCheck=new i(H.PanelDownloads,r.Frontend_FluentCore_Settings_ShowDownloadsPanel_Label,r.Frontend_FluentCore_Settings_ShowDownloadsPanel_Description,!1),this.SettingPanelDownloads=this.settingPanelDownloadsCheck.Value,this.ShowSettingsDialog=()=>{},this.SettingLanguage=this.#e.Get(c.Language),this.SettingMediaDirectory=this.#e.Get(c.MediaDirectory),this.settingThemeChoice.Subscribe(e=>this.SettingSelectedTheme=G.get(e)),this.settingPanelBookmarksCheck.Subscribe(e=>this.SettingPanelBookmarks=e),this.settingPanelDownloadsCheck.Subscribe(e=>this.SettingPanelDownloads=e),this.Initialize()}async Initialize(){await this.#t.Initialize(this.settingThemeChoice,this.settingPanelBookmarksCheck,this.settingPanelDownloadsCheck),this.SettingPanelBookmarks=this.settingPanelBookmarksCheck.Value,this.SettingPanelDownloads=this.settingPanelDownloadsCheck.Value}get GlobalSettings(){return[...this.#e]}get FrontendSettings(){return[...this.#t]}SettingSelectedThemeChanged(){this.settingThemeChoice.Value=this.SettingSelectedTheme.key,Ce(this.SettingSelectedTheme.value)}SettingPanelBookmarksChanged(){this.settingPanelBookmarksCheck.Value=this.SettingPanelBookmarks}SettingPanelDownloadsChanged(){this.settingPanelDownloadsCheck.Value=this.SettingPanelDownloads}};V([S],SettingsManager.prototype,`SettingSelectedTheme`,void 0),V([S],SettingsManager.prototype,`SettingPanelBookmarks`,void 0),V([S],SettingsManager.prototype,`SettingPanelDownloads`,void 0),V([S],SettingsManager.prototype,`ShowSettingsDialog`,void 0);var K=_.createContext(),Ae=g`
    :host {
        /* Extend/Override the default value of '--body-font' to support colored emoji flags */
        --body-font: NotoColorEmoji-Flags, 'Segoe UI Variable', 'Segoe UI', sans-serif;

        font-family: var(--body-font);
        font-size: var(--fontSizeBase300);
        gap: 0;
        display: grid;
        grid-template-columns: auto;
        grid-template-rows: min-content min-content minmax(0, 1fr);
        border: 1px var(--colorNeutralStroke3) solid;
        border-radius: var(--borderRadiusXLarge);
        height: calc(100vh - 2 * var(--strokeWidthThin));
        background-color: var(--colorNeutralBackground2);
        color: var(--colorNeutralForeground1);
        user-select: none;
    }

    #titlebar {
    }

    #widgets {
        display: flex;
        flex-direction: row;
        gap: var(--spacingHorizontalS);
        margin: var(--spacingHorizontalS);
    }

    #preview {
    }

    #sidepanel {
        flex: 2;
        display: flex;
        flex-direction: column;
        gap: var(--spacingHorizontalS);
    }

    #mainpanel {
        flex: 3;
        gap: var(--spacingHorizontalS);
        display: grid;
        grid-template-columns: auto;
        grid-template-rows: min-content min-content minmax(0, 1fr);
    }

    #bookmark-list-panel {
        flex: 1;
        min-height: 0;
        /*border: 1px dotted green;*/
    }

    #download-manager-panel {
        flex: 1;
        min-height: 0;
        /*border: 1px dotted blue;*/
    }

    #bookmark-list, #download-manager, #website-select, #media-title-select, #media-item-list {
        height: 100%;
    }
`,je=y`
    <div id="widgets">
        ${h(e=>e.SettingsManager.SettingPanelBookmarks||e.SettingsManager.SettingPanelDownloads,y`
    <div id="sidepanel">
        <fluent-card id="bookmark-list-panel" style="display: ${e=>e.SettingsManager.SettingPanelBookmarks?`block`:`none`}">
            <fluent-bookmark-list id="bookmark-list"
                @bookmarkClicked=${(e,t)=>e.selectedTitle=t.event.detail}></fluent-bookmark-list>
        </fluent-card>
        <!-- TODO: Download Panel not shown, probably not Injected/Initialized? -->
        <fluent-card id="download-manager-panel" style="display: ${e=>e.SettingsManager.SettingPanelDownloads?`block`:`none`}">
            <fluent-download-manager id="download-manager"></fluent-download-manager>
        </fluent-card>
    </div>
`)}
        <div id="mainpanel">
            <fluent-card>
                <fluent-website-select id="website-select" :Entries=${()=>HakuNeko.PluginController.WebsitePlugins} :Selected=${e=>e.selectedWebsite}
                    @selectedChanged=${(e,t)=>e.SelectedWebsiteChanged(t.event)}>
                </fluent-website-select>
            </fluent-card>
            <fluent-card>
                <fluent-media-title-select id="media-title-select" :Container=${e=>e.selectedWebsite} :Selected=${e=>e.selectedTitle}
                    @selectedChanged=${(e,t)=>e.SelectedMediaTitleChanged(t.event)}>
                </fluent-media-title-select>
            </fluent-card>
            <fluent-card>
                <fluent-media-item-list id="media-item-list" :Container=${e=>e.selectedTitle}
                    @previewClicked=${(e,t)=>e.previewEntry=t.event.detail}></fluent-media-item-list>
            </fluent-card>
        </div>
    </div>
`,Me=y`
    <fluent-media-item-preview id="preview" :Entry=${e=>e.previewEntry}
        @entryChanged=${(e,t)=>e.previewEntry=t.eventDetail()}></fluent-media-item-preview>
`,Ne=y`
    <fluent-settings-dialog></fluent-settings-dialog>
    <fluent-titlebar id="titlebar"></fluent-titlebar>
    ${h(e=>!e.previewEntry,je)}
    ${h(e=>e.previewEntry,Me)}
`,q=class App extends z{SelectedWebsiteChanged(e){this.selectedWebsite=e.detail,this.selectedWebsite?.IsSameAs(this.selectedTitle?.Parent)||(this.selectedTitle=void 0)}SelectedMediaTitleChanged(e){this.selectedTitle=e.detail,this.selectedTitle&&(this.selectedWebsite||this.selectedTitle?.Parent)&&!this.selectedWebsite?.IsSameAs(this.selectedTitle?.Parent)&&(this.selectedWebsite=this.selectedTitle?.Parent)}};V([K],q.prototype,`SettingsManager`,void 0),V([S],q.prototype,`selectedWebsite`,void 0),V([S],q.prototype,`selectedTitle`,void 0),V([S],q.prototype,`previewEntry`,void 0),q=V([ae({name:`fluent-app`,template:Ne,styles:Ae})],q);var WindowManager=class{constructor(e){this.windowController=e,this.IsMaximized=!1,this.windowController.Maximized.Subscribe(e=>this.IsMaximized=e)}Minimize(){this.windowController.Minimize()}Maximize(){this.windowController.Maximize()}Restore(){this.windowController.Restore()}Close(){this.windowController.Close()}};V([S],WindowManager.prototype,`IsMaximized`,void 0);var J=_.createContext();function __decorateParam(e,t){return function(n,r){t(n,r,e)}}var Y=class LocalizationProvider{constructor(e){this.SettingsManager=e,this.Locale=a(),this.SettingsManager.SettingLanguage.Subscribe(()=>this.Locale=a())}Get(e,...t){return this.Locale[e](...t)}};V([S],Y.prototype,`Locale`,void 0),Y=V([__decorateParam(0,K)],Y);var X=_.createContext(),Pe=g`

    :host {
        gap: 0;
        display: grid;
        align-items: center;
        grid-template-columns: max-content auto max-content;
        border-top-left-radius: var(--borderRadiusXLarge);
        border-top-right-radius: var(--borderRadiusXLarge);
    }

    #menu {
        display: block;
    }

    #menu-button {
        min-width: unset !important;
    }

    #title {
        font-weight: bold;
        text-align: center;
        -webkit-app-region: drag;
    }

    #version {
        font-size: 10px;
        font-weight: normal;
        color: var(--colorNeutralForeground4);
        margin-left: var(--spacingHorizontalXS);
        -webkit-app-region: drag;
    }

    #controls {
        display: flex;
    }

    #controls > fluent-button#close:hover {
        background-color: var(--colorStatusDangerBackground2) !important;
    }

    #menu-overlay {
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 2147483647;
    }

    fluent-menu-item div[slot="start"] {
        display: flex;
    }
`,Fe=y`
    <fluent-button icon-only appearance="transparent" :title=${e=>e.Localization.Locale.Frontend_FluentCore_Button_ToggleTheme_Description(e.Localization.Get(W.label))} :innerHTML=${()=>oe} @click=${e=>e.SettingsManager.SettingSelectedTheme=W}></fluent-button>
`,Ie=y`
    <fluent-button icon-only appearance="transparent" :title=${e=>e.Localization.Locale.Frontend_FluentCore_Button_ToggleTheme_Description(e.Localization.Get(U.label))} :innerHTML=${()=>de} @click=${e=>e.SettingsManager.SettingSelectedTheme=U}></fluent-button>
`,Le=y`
    <fluent-menu id="menu">
        <fluent-menu-button id="menu-button" slot="trigger" appearance="subtle" title="${e=>e.Localization.Locale.Frontend_FluentCore_Menu_Description()}" :innerHTML=${()=>M}></fluent-menu-button>
        <fluent-menu-list id="menu-popup">
            <fluent-menu-item role="menuitemcheckbox" title="${e=>e.Localization.Locale.Frontend_FluentCore_Settings_ShowBookmarksPanel_Description()}" :checked=${e=>e.SettingsManager.SettingPanelBookmarks} @change=${(e,t)=>e.SettingsManager.SettingPanelBookmarks=t.eventTarget().checked}>
                <div slot="start" :innerHTML=${()=>p}></div>
                ${e=>e.Localization.Locale.Frontend_FluentCore_Settings_ShowBookmarksPanel_Label()}
            </fluent-menu-item>
            <fluent-menu-item role="menuitemcheckbox" title="${e=>e.Localization.Locale.Frontend_FluentCore_Settings_ShowDownloadsPanel_Description()}" :checked=${e=>e.SettingsManager.SettingPanelDownloads} @change=${(e,t)=>e.SettingsManager.SettingPanelDownloads=t.eventTarget().checked}>
                <div slot="start" :innerHTML=${()=>ie}></div>
                ${e=>e.Localization.Locale.Frontend_FluentCore_Settings_ShowDownloadsPanel_Label()}
            </fluent-menu-item>
            <fluent-divider></fluent-divider>
            <fluent-menu-item title="${e=>e.Localization.Locale.Frontend_FluentCore_Menu_OpenSettings_Description()}" @click=${e=>e.ShowGlobalSettingsDialog()}>
                <div slot="start" :innerHTML=${()=>d}></div>
                ${e=>e.Localization.Locale.Frontend_FluentCore_Menu_OpenSettings_Label()}
            </fluent-menu-item>
            <fluent-menu-item title="${e=>e.Localization.Locale.Frontend_FluentCore_Menu_ImportBookmarks_Description()}" @click=${e=>e.ImportBookmarks()}>
                <div slot="start" :innerHTML=${()=>ue}></div>    
                ${e=>e.Localization.Locale.Frontend_FluentCore_Menu_ImportBookmarks_Label()}
            </fluent-menu-item>
            <fluent-menu-item title="${e=>e.Localization.Locale.Frontend_FluentCore_Menu_ExportBookmarks_Description()}" @click=${e=>e.ExportBookmarks()}>
                <div slot="start" :innerHTML=${()=>ce}></div>   
                ${e=>e.Localization.Locale.Frontend_FluentCore_Menu_ExportBookmarks_Label()}
            </fluent-menu-item>
            <fluent-divider></fluent-divider>
            <fluent-menu-item title="${e=>e.Localization.Locale.Settings_FeatureFlags_Description()}">
                <div slot="start" :innerHTML=${()=>ne}></div>
                ${e=>e.Localization.Locale.Settings_FeatureFlags_Label()}
                <fluent-menu-list slot="submenu">
                    <fluent-menu-item role="menuitemcheckbox" title="${e=>e.Localization.Locale[HakuNeko.FeatureFlags.HideSplashScreen.Description]()}" :checked=${()=>!HakuNeko.FeatureFlags.HideSplashScreen.Value} @change=${(e,t)=>HakuNeko.FeatureFlags.HideSplashScreen.Value=!t.eventTarget().checked}>
                        <div slot="start" :innerHTML=${()=>se}></div>
                        ${e=>e.Localization.Locale[HakuNeko.FeatureFlags.HideSplashScreen.Label]()}
                    </fluent-menu-item>
                    <fluent-menu-item role="menuitemcheckbox" title="${e=>e.Localization.Locale[HakuNeko.FeatureFlags.VerboseFetchWindow.Description]()}" :checked=${()=>HakuNeko.FeatureFlags.VerboseFetchWindow.Value} @change=${(e,t)=>HakuNeko.FeatureFlags.VerboseFetchWindow.Value=t.eventTarget().checked}>
                        <div slot="start" :innerHTML=${()=>N}></div>
                        ${e=>e.Localization.Locale[HakuNeko.FeatureFlags.VerboseFetchWindow.Label]()}
                    </fluent-menu-item>
                    <fluent-menu-item role="menuitemcheckbox" title="${e=>e.Localization.Locale[HakuNeko.FeatureFlags.CrowdinTranslationMode.Description]()}" :checked=${()=>HakuNeko.FeatureFlags.CrowdinTranslationMode.Value} @change=${(e,t)=>HakuNeko.FeatureFlags.CrowdinTranslationMode.Value=t.eventTarget().checked}>
                        <div slot="start" :innerHTML=${()=>le}></div>
                        ${e=>e.Localization.Locale[HakuNeko.FeatureFlags.CrowdinTranslationMode.Label]()}
                    </fluent-menu-item>
                </fluent-menu-list>
            </fluent-menu-item>
        </fluent-menu-list>
    </fluent-menu>
    <div id="title">${e=>e.Localization.Locale.Frontend_Product_Title()}<span id="version" title="${e=>e.Localization.Locale.Frontend_FluentCore_Version_Description()}">v${()=>`1.0.0`}</span></div>
    <div id="controls">
        ${e=>e.SettingsManager.SettingSelectedTheme===W?Ie:Fe}
        <fluent-button icon-only appearance="subtle" title="${e=>e.Localization.Locale.Frontend_FluentCore_Window_ButtonMinimize_Description()}" :innerHTML=${()=>f} @click="${e=>e.WindowManager.Minimize()}"></fluent-button>
        <fluent-button icon-only appearance="subtle" title="${e=>e.WindowManager.IsMaximized?e.Localization.Locale.Frontend_FluentCore_Window_ButtonRestore_Description():e.Localization.Locale.Frontend_FluentCore_Window_ButtonMaximize_Description()}" :innerHTML=${e=>e.WindowManager.IsMaximized?be:pe} @click="${e=>e.WindowManager.IsMaximized?e.WindowManager.Restore():e.WindowManager.Maximize()}"></fluent-button>
        <fluent-button icon-only id="close" appearance="subtle" title="${e=>e.Localization.Locale.Frontend_FluentCore_Window_ButtonClose_Description()}" :innerHTML=${()=>u} @click=${e=>e.WindowManager.Close()}></fluent-button>
    </div>
`,TitleBar=class extends z{constructor(...e){super(...e),this.maximized=!1,this.settings=!1}ShowGlobalSettingsDialog(){this.SettingsManager.ShowSettingsDialog(...this.SettingsManager.GlobalSettings)}async ImportBookmarks(){try{let e=await HakuNeko.BookmarkPlugin.Import();console.log(e)}catch(e){console.error(e)}}async ExportBookmarks(){try{let e=await HakuNeko.BookmarkPlugin.Export();console.log(e)}catch(e){console.error(e)}}};V([J],TitleBar.prototype,`WindowManager`,void 0),V([X],TitleBar.prototype,`Localization`,void 0),V([K],TitleBar.prototype,`SettingsManager`,void 0),V([S],TitleBar.prototype,`maximized`,void 0),V([S],TitleBar.prototype,`settings`,void 0),TitleBar.define({name:`fluent-titlebar`,template:Le,styles:Pe});function CreateMediaItemTemplate(e,t=e=>!0){let n=[`height: var(--fontSizeBase600)`,`padding: var(--spacingHorizontalXS)`,`border - top: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle)`,`gap: var(--spacingHorizontalXS)`,`display: grid`,`align-items: center`,`grid-template-rows: min-content`,`grid-template-columns: min-content min-content 1fr`,`cursor: pointer`].join(`;`),r=[n,`opacity: 0.5`].join(`;`),i=[`margin-right: var(--spacingHorizontalXS)`,`height: inherit`].join(`;`),a=[`overflow: hidden`,`white-space: nowrap`,`text-overflow: ellipsis`].join(`;`),onMouseOver=(e,t)=>{let n=t.eventTarget();n.style.backgroundColor=getComputedStyle(t.eventTarget()).getPropertyValue(`--colorNeutralBackground1Hover`)},onMouseOut=(e,t)=>{t.eventTarget().style.backgroundColor=``};return y`
        <div style="${e=>t(e)?n:r}" @mouseover="${onMouseOver}" @mouseout="${onMouseOut}" @click="${e}">
            <img style="${i}" src="${e=>e.Parent.Icon}"></img>
            <div style="${a}">${e=>e.Title}</div>
        </div>
    `}var Re=g`

    :host {
        display: grid;
        grid-template-columns: auto;
        grid-template-rows: min-content min-content minmax(0, 1fr);
    }

    #header {
        padding: var(--spacingHorizontalS);
        background-color: var(--colorNeutralBackground4);
        display: grid;
        align-items: center;
        grid-template-rows: auto;
        grid-template-columns: minmax(0, 1fr) max-content;
    }

    #title {
        text-transform: uppercase;
        font-weight: bold;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .hint {
        color: var(--colorNeutralForeground4);
    }

    .missing {
        opacity: 0.5;
    }

    #searchcontrol {
        padding: var(--spacingHorizontalS);
        border-top: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle);
        border-bottom: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle);
        background-color: var(--colorNeutralBackground4);
    }

    #entries {
        padding: 0;
        margin: 0;
    }
`,ze=y`
    <div id="header">
        <div id="title">${e=>e.Localization.Locale.Frontend_FluentCore_BookmarkList_Heading()}</div>
        <div class="hint">${e=>e.filtered?.length??`┄`}／${e=>e.Entries?.length??`┄`}</div>
    </div>
    <div id="searchcontrol">
        <fluent-searchbox placeholder="" @predicate=${(e,t)=>e.Match=t.event.detail}></fluent-searchbox>
    </div>
    <fluent-lazy-scroll id="entries" :Items=${e=>e.filtered} :Template=${e=>CreateMediaItemTemplate(e.SelectEntry.bind(e),e=>!e?.IsOrphaned)}></fluent-lazy-scroll>
`,BookmarkList=class extends z{constructor(...e){super(...e),this.Entries=[],this.Match=()=>!0,this.filtered=[],this.updating=!1,this.BookmarksChanged=function(){this.Entries=HakuNeko.BookmarkPlugin.Entries.Value.slice()}.bind(this)}connectedCallback(){super.connectedCallback(),HakuNeko.BookmarkPlugin.Entries.Subscribe(this.BookmarksChanged),this.BookmarksChanged()}disconnectedCallback(){super.disconnectedCallback(),HakuNeko.BookmarkPlugin.Entries.Unsubscribe(this.BookmarksChanged)}EntriesChanged(){this.FilterEntries()}MatchChanged(){this.FilterEntries()}SelectEntry(e){this.$emit(`bookmarkClicked`,e)}FilterEntries(){this.filtered=this.Entries.filter(e=>this.Match(e.Title))}};V([X],BookmarkList.prototype,`Localization`,void 0),V([S],BookmarkList.prototype,`Entries`,void 0),V([S],BookmarkList.prototype,`Match`,void 0),V([S],BookmarkList.prototype,`filtered`,void 0),V([S],BookmarkList.prototype,`updating`,void 0),BookmarkList.define({name:`fluent-bookmark-list`,template:ze,styles:Re});var Be=g`

    :host {
        display: grid;
        grid-template-columns: auto;
        grid-template-rows: min-content min-content minmax(0, 1fr);
    }

    #header {
        padding: var(--spacingHorizontalS);
        background-color: var(--colorNeutralBackground4);
        display: grid;
        align-items: center;
        grid-template-rows: auto;
        grid-template-columns: minmax(0, 1fr) max-content;
    }

    #title {
        text-transform: uppercase;
        font-weight: bold;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .hint {
        color: var(--colorNeutralForeground4);
    }

    #searchcontrol {
        padding: var(--spacingHorizontalS);
        border-top: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle);
        border-bottom: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle);
        background-color: var(--colorNeutralBackground4);
    }

    #entries {
        overflow-y: scroll;
        overflow-x: hidden;
    }
`;function CreateItemTemplate$3(e){return y`<fluent-download-manager-task :Entry=${e=>e}></fluent-download-manager-task>`}var Ve=y`
    <div id="header">
        <div id="title">${e=>e.Localization.Locale.Frontend_FluentCore_DownloadManager_Heading()}</div>
        <div class="hint">${e=>e.filtered?.length??`┄`}／${e=>e.Entries?.length??`┄`}</div>
    </div>
    <div id="searchcontrol">
        <fluent-searchbox placeholder="" @predicate=${(e,t)=>e.Match=t.event.detail}></fluent-searchbox>
    </div>
    <div id="entries">
        ${v(e=>e.filtered,CreateItemTemplate$3)}
    </div>
`,DownloadManager=class extends z{constructor(...e){super(...e),this.Entries=[],this.Match=()=>!0,this.filtered=[],this.DownloadsChanged=async()=>{this.Entries=HakuNeko.DownloadManager.Queue.Value.slice()}}connectedCallback(){super.connectedCallback(),HakuNeko.DownloadManager.Queue.Subscribe(this.DownloadsChanged),this.DownloadsChanged()}disconnectedCallback(){super.disconnectedCallback(),HakuNeko.DownloadManager.Queue.Unsubscribe(this.DownloadsChanged)}EntriesChanged(){this.FilterEntries()}MatchChanged(){this.FilterEntries()}FilterEntries(){this.filtered=this.Entries.filter(e=>this.Match(e.Media.Title)).slice(0,500)}};V([X],DownloadManager.prototype,`Localization`,void 0),V([S],DownloadManager.prototype,`Entries`,void 0),V([S],DownloadManager.prototype,`Match`,void 0),V([S],DownloadManager.prototype,`filtered`,void 0),DownloadManager.define({name:`fluent-download-manager`,template:Ve,styles:Be});var He={[B.Queued]:fe,[B.Paused]:xe,[B.Downloading]:T,[B.Processing]:Se,[B.Failed]:ye,[B.Completed]:C},Ue=g`

    :host {
        display: flex;
        flex-direction: column;
        gap: var(--spacingHorizontalXS);
        padding: var(--spacingHorizontalXS);
        border-top: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle);
    }

    .mediatitle {
        font-weight: bold;
    }

    .mediatitle, .mediaitem {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .controls {
        gap: var(--spacingHorizontalXS);
        display: grid;
        align-items: center;
        grid-template-columns:  minmax(0, 1fr) min-content min-content;
        white-space: nowrap;
    }

    .status {
        display: contents;
    }

    .status.${B.Queued} svg {
        opacity: 0.5;
    }

    .status.${B.Paused} svg {
    }

    .status.${B.Downloading} svg {
    }

    .status.${B.Processing} svg {
    }

    .status.${B.Failed} svg {
        cursor: pointer;
        fill: #FF6060;
    }

    .status.${B.Completed} svg {
        fill: #20C040;
    }
`,We=y`
    <div class="mediatitle">${e=>e.Entry?.Media.Parent.Title}</div>
    <div class="mediaitem">${e=>e.Entry?.Media.Title}</div>
    <div class="controls">
        <fluent-progress-bar min="0" max="1" :paused=${()=>!1} :value=${e=>e.progress}></fluent-progress-bar>
        <div class="status ${e=>e.status}" :innerHTML=${e=>He[e.status]} @click=${e=>e.ShowErrors()}></div>
        <fluent-button icon-only size="small" appearance="transparent" title="${e=>e.Localization.Locale.Frontend_FluentCore_DownloadManagerTask_RemoveButton_Description()}" :innerHTML=${()=>k} @click=${e=>HakuNeko.DownloadManager.Dequeue(e.Entry)}></fluent-button>
    </div>
`,DownloadManagerTask=class extends z{constructor(...e){super(...e),this.progress=0,this.UpdateStatus=function(e){this.status=e}.bind(this),this.UpdateProgress=function(e){this.progress=e??0}.bind(this)}connectedCallback(){super.connectedCallback()}disconnectedCallback(){super.disconnectedCallback(),this.Entry?.Status.Unsubscribe(this.UpdateStatus),this.Entry?.Progress.Unsubscribe(this.UpdateProgress)}EntryChanged(e,t){e?.Status.Unsubscribe(this.UpdateStatus),t?.Status.Subscribe(this.UpdateStatus),e?.Progress.Unsubscribe(this.UpdateProgress),t?.Progress.Subscribe(this.UpdateProgress),this.UpdateStatus(this.Entry?.Status.Value),this.UpdateProgress(this.Entry?.Progress.Value)}ShowErrors(){if(this.Entry.Errors.Value.length>0){let e=this.Entry.Errors.Value.map(e=>`<div>${e.message}</div><pre>${e.stack}</pre>`).join(`<hr>`);window.open(null,`_blank`,[`titlebar=no`,`menubar=no`,`toolbar=no`,`location=no`,`status=no`,`scrollbars=yes`,`resizable=yes`,`width=800`,`height=480`].join(`, `)).document.write(e)}}};V([X],DownloadManagerTask.prototype,`Localization`,void 0),V([S],DownloadManagerTask.prototype,`Entry`,void 0),V([S],DownloadManagerTask.prototype,`status`,void 0),V([S],DownloadManagerTask.prototype,`progress`,void 0),DownloadManagerTask.define({name:`fluent-download-manager-task`,template:We,styles:Ue});var Ge=g`

    :host {
        display: grid;
        grid-template-columns: auto;
        grid-template-rows: min-content minmax(0, 1fr);
    }

    #heading {
        background-color: var(--colorNeutralBackground4);
        padding: var(--spacingHorizontalXS);
        gap: var(--spacingHorizontalS);
        display: grid;
        align-items: center;
        grid-template-columns: max-content 1fr max-content;
    }

    #heading:hover {
        cursor: pointer;
        background-color: var(--colorNeutralBackground1Hover);
    }

    #heading #logo {
        height: var(--fontSizeBase600);
    }

    #heading #title {
        font-weight: bold;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    #controls {
        display: flex;
        align-items: center;
    }

    #controls .hint {
        margin-left: var(--spacingHorizontalXS);
        margin-right: var(--spacingHorizontalXS);
    }

    #dropdown {
        height: 100%;
        display: none;
    }

    #searchcontrol {
        padding: var(--spacingHorizontalS);
        border-top: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle);
        border-bottom: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle);
        background-color: var(--colorNeutralBackground4);
    }

    #button-update-entries.updating svg {
        animation: spinning 1.5s linear infinite;
    }

    @keyframes spinning {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    #entries {
        height: 320px;
        padding: 0;
        margin: 0;
    }

    .hint {
        color: var(--colorNeutralForeground4);
    }
`,Ke=y`
    <fluent-button icon-only id="add-favorite-button" appearance="transparent" title="${e=>e.Localization.Locale.Frontend_FluentCore_WebsiteSelect_AddFavoriteButton_Description()}" ?disabled=${e=>!e.Selected} :innerHTML=${()=>R} @click=${(e,t)=>e.AddFavorite(t.event)}></fluent-button>
`,qe=y`
    <fluent-button icon-only id="remove-favorite-button" appearance="transparent" title="${e=>e.Localization.Locale.Frontend_FluentCore_WebsiteSelect_RemoveFavoriteButton_Description()}" ?disabled=${e=>!e.Selected} :innerHTML=${()=>O} @click=${(e,t)=>e.RemoveFavorite(t.event)}></fluent-button>
`;function CreateItemTemplate$2(e,t=e=>!0){let n=[`height: 42px`,`padding: var(--spacingHorizontalXS)`,`border-top: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle)`,`gap: var(--spacingHorizontalXS)`,`display: grid`,`grid-template-rows: min-content 1fr`,`grid-template-columns: min-content 1fr`,`cursor: pointer`].join(`;`),r=[n,`opacity: 0.5`].join(`;`),i=[`margin-right: var(--spacingHorizontalXS)`,`height: inherit`,`grid-row: 1 / -1`].join(`;`),a=[`overflow: hidden`,`white-space: nowrap`,`text-overflow: ellipsis`].join(`;`);return y`
        <div  style="${e=>t(e)?n:r}" onmouseover="this.style.backgroundColor = getComputedStyle(this).getPropertyValue('--colorNeutralBackground1Hover')" onmouseout="this.style.backgroundColor = ''" @click=${t=>e(t)}>
            <img style="${i}" src="${e=>e.Icon}"></img>
            <div style="${[a,`font-weight: bold`].join(`;`)}">${e=>e.Title}</div>
            <div style="${[a,`color: var(--colorNeutralForeground4)`].join(`;`)}">${e=>e.Identifier}</div>
        </div>
    `}var Je=y`
    <div id="heading" title="${e=>e.Localization.Locale.Frontend_FluentCore_WebsiteSelect_Description()}" @click=${e=>e.Expanded=!e.Expanded}>
        <img id="logo" src="${e=>e.Selected?.Icon}"></img>
        <div id="title">${e=>e.Selected?.Title??`…`}</div>
        <div id="controls">
            <div class="hint">${e=>(e.filtered?.length??``)+`／`+(e.Entries?.length??``)}</div>
            <fluent-button icon-only id="button-browse" appearance="transparent" title="${e=>e.Selected?.URI?.href}" ?disabled=${e=>!e.Selected?.URI} :innerHTML=${()=>F} @click="${(e,t)=>e.OpenBrowser(t.event)}"></fluent-button>
            ${e=>e.favorite?qe:Ke}
            <fluent-button icon-only id="button-settings" appearance="transparent" title="${e=>e.Localization.Locale.Frontend_FluentCore_WebsiteSelect_OpenSettingsButton_Description()}" ?disabled=${e=>!e.Selected} :innerHTML=${()=>A} @click="${(e,t)=>e.OpenSettings(t.event)}"></fluent-button>
        </div>
    </div>
    <div id="dropdown" ${m(`dropdown`)}>
        <div id="searchcontrol">
            <fluent-searchbox id="searchbox" ${m(`searchbox`)} placeholder="${e=>e.Localization.Locale.Frontend_FluentCore_WebsiteSelect_SearchBox_Placeholder()}" @predicate=${(e,t)=>e.Match=t.event.detail}></fluent-searchbox>
        </div>
        <fluent-lazy-scroll id="entries" :Items=${e=>e.filtered} :Template=${e=>CreateItemTemplate$2(e.SelectEntry.bind(e))}></fluent-lazy-scroll>
    </div>
`,WebsiteSelect=class extends z{constructor(...e){super(...e),this.Entries=[],this.Match=()=>!0,this.filtered=[],this.Expanded=!1,this.updating=!1,this.favorite=!1}EntriesChanged(){this.FilterEntries()}MatchChanged(){this.FilterEntries()}SelectedChanged(e,t){(t||e)&&!t?.IsSameAs(e)&&this.$emit(`selectedChanged`,this.Selected)}ExpandedChanged(){this.dropdown&&(this.dropdown.style.display=this.Expanded?`block`:`none`,this.searchbox.Focus())}async FilterEntries(){this.filtered=this.Entries.filter(e=>this.Match(e.Title))}SelectEntry(e){this.Selected=e,this.Expanded=!1,b.notify(this,`expanded`)}AddFavorite(e){e.stopPropagation(),this.favorite=!0,console.log(`Added Favorite`,this.Selected?.Identifier)}RemoveFavorite(e){e.stopPropagation(),this.favorite=!1,console.log(`Removed Favorite`,this.Selected?.Identifier)}OpenSettings(e){e.stopPropagation(),this.Selected?.Settings&&this.SettingsManager.ShowSettingsDialog(...this.Selected.Settings)}OpenBrowser(e){e.stopPropagation(),this.Selected?.URI&&window.open(this.Selected.URI)}};V([X],WebsiteSelect.prototype,`Localization`,void 0),V([K],WebsiteSelect.prototype,`SettingsManager`,void 0),V([S],WebsiteSelect.prototype,`Entries`,void 0),V([S],WebsiteSelect.prototype,`Match`,void 0),V([S],WebsiteSelect.prototype,`filtered`,void 0),V([S],WebsiteSelect.prototype,`Selected`,void 0),V([S],WebsiteSelect.prototype,`Expanded`,void 0),V([S],WebsiteSelect.prototype,`updating`,void 0),V([S],WebsiteSelect.prototype,`favorite`,void 0),WebsiteSelect.define({name:`fluent-website-select`,template:Je,styles:Ge});var Ye=g`

    :host {
        display: grid;
        grid-template-columns: auto;
        grid-template-rows: min-content minmax(0, 1fr);
    }

    #heading {
        background-color: var(--colorNeutralBackground4);
        padding: var(--spacingHorizontalXS);
        gap: var(--spacingHorizontalS);
        display: grid;
        align-items: center;
        grid-template-columns: max-content 1fr max-content;
    }

    #heading:hover {
        cursor: pointer;
        background-color: var(--colorNeutralBackground1Hover);
    }

    #heading #logo {
        height: var(--fontSizeBase600);
    }

    #heading #title {
        font-weight: bold;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    #controls {
        display: flex;
        align-items: center;
    }

    #controls .hint {
        margin-left: var(--spacingHorizontalXS);
        margin-right: var(--spacingHorizontalXS);
    }

    #dropdown {
        height: 100%;
        display: none;
    }

    #searchcontrol {
        padding: var(--spacingHorizontalS);
        border-top: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle);
        border-bottom: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle);
        background-color: var(--colorNeutralBackground4);
    }

    #button-update-entries.updating svg {
        animation: spinning 1.5s linear infinite;
    }

    @keyframes spinning {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    #entries {
        height: 320px;
        padding: 0;
        margin: 0;
    }

    .hint {
        color: var(--colorNeutralForeground4);
    }
`,Xe=y`
    <fluent-button icon-only id="add-favorite-button" appearance="transparent" ?disabled=${e=>!e.Selected} title="${e=>e.Localization.Locale.Frontend_FluentCore_MediaTitleSelect_AddBookmarkButton_Description()}" :innerHTML=${()=>P} @click=${(e,t)=>e.AddBookmark(t.event)}></fluent-button>
`,Ze=y`
    <fluent-button icon-only id="remove-favorite-button" appearance="transparent" ?disabled=${e=>!e.Selected} title="${e=>e.Localization.Locale.Frontend_FluentCore_MediaTitleSelect_RemoveBookmarkButton_Description()}" :innerHTML=${()=>E} @click=${(e,t)=>e.RemoveBookmark(t.event)}></fluent-button>
`;function CreateItemTemplate$1(e,t=e=>!0){let n=[`height: 42px`,`padding: var(--spacingHorizontalXS)`,`border-top: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle)`,`gap: var(--spacingHorizontalXS)`,`display: grid`,`grid-template-rows: min-content 1fr`,`grid-template-columns: min-content 1fr`,`cursor: pointer`].join(`;`),r=[n,`opacity: 0.5`].join(`;`),i=[`margin-right: var(--spacingHorizontalXS)`,`height: inherit`,`grid-row: 1 / -1`].join(`;`),a=[`overflow: hidden`,`white-space: nowrap`,`text-overflow: ellipsis`].join(`;`);return y`
        <div style="${e=>t(e)?n:r}" onmouseover="this.style.backgroundColor = getComputedStyle(this).getPropertyValue('--colorNeutralBackground1Hover')" onmouseout="this.style.backgroundColor = ''" @click=${t=>e(t)}>
            <img style="${i}" src="${e=>e.Icon}"></img>
            <div style="${[a,`font-weight: bold`].join(`;`)}">${e=>e.Title}</div>
            <div style="${[a,`color: var(--colorNeutralForeground4)`].join(`;`)}">${e=>e.Identifier}</div>
        </div>
    `}var Qe=y`
    <div id="heading" title="${e=>e.Localization.Locale.Frontend_FluentCore_MediaTitleSelect_Description()}" @click=${e=>e.Expanded=!e.Expanded}>
        <img id="logo" src="${e=>e.Selected?.Icon}"></img>
        <div id="title">${e=>e.Selected?.Title??`…`}</div>
        <div id="controls">
            <div class="hint">${e=>e.updating.includes(e.Container?.Identifier)||e.pasting?`┄`:(e.filtered?.length??``)+`／`+(e.Container?.Entries.Value.length??``)}</div>
            <fluent-button
                icon-only
                id="button-update-entries"
                appearance="transparent"
                class="${e=>e.updating.includes(e.Container?.Identifier)||e.pasting?`updating`:``}"
                title="${e=>e.Localization.Locale.Frontend_FluentCore_WebsiteSelect_UpdateEntriesButton_Description()}"
                ?disabled=${e=>!e.Container||e.updating.includes(e.Container?.Identifier)||e.pasting}
                :innerHTML=${()=>D}
                @click=${(e,t)=>e.UpdateEntries(t.event)}>
            </fluent-button>
            ${e=>e.bookmark?Ze:Xe}
            <fluent-button
                icon-only
                id="paste-clipboard-button"
                appearance="transparent"
                title="${e=>e.Localization.Locale.Frontend_FluentCore_MediaTitleSelect_PasteClipboardButton_Description()}"
                ?disabled=${e=>e.updating.includes(e.Container?.Identifier)||e.pasting}
                :innerHTML=${()=>ve}
                @click="${(e,t)=>e.PasteClipboard(t.event)}">
            </fluent-button>
        </div>
    </div>
    <div id="dropdown" ${m(`dropdown`)}>
        <div id="searchcontrol">
            <fluent-searchbox id="searchbox" ${m(`searchbox`)} placeholder="${e=>e.Localization.Locale.Frontend_FluentCore_MediaTitleSelect_SearchBox_Placeholder()}" allowcase allowregex @predicate=${(e,t)=>e.Match=t.event.detail}></fluent-searchbox>
        </div>
        <fluent-lazy-scroll id="entries" :Items=${e=>e.filtered} :Template=${e=>CreateItemTemplate$1(e.SelectEntry.bind(e))}></fluent-lazy-scroll>
    </div>
`,MediaTitleSelect=class extends z{constructor(...e){super(...e),this.Match=()=>!0,this.filtered=[],this.Expanded=!1,this.updating=[],this.bookmark=!1,this.scanning=!1,this.pasting=!1,this.BookmarksChanged=function(e,t){this.bookmark=this.Selected&&t.IsBookmarked(this.Selected)}.bind(this),this.PastedClipboardUrlChanged=async function(e){try{this.pasting=!0;for(let t of HakuNeko.PluginController.WebsitePlugins){let n=await t.TryGetEntry(e.href);if(n){n=HakuNeko.BookmarkPlugin.Entries.Value.find(e=>e.IsSameAs(n))??n,await n.Update(),(!this.Selected||!this.Selected.IsSameAs(n))&&(this.Selected=n);return}}throw new s(r.Frontend_Media_PasteLink_NotFoundError,e.href)}catch(e){console.warn(e)}finally{this.pasting=!1}}.bind(this)}connectedCallback(){super.connectedCallback(),HakuNeko.BookmarkPlugin.Entries.Subscribe(this.BookmarksChanged),HakuNeko.PastedClipboardURL.Subscribe(this.PastedClipboardUrlChanged),this.FilterEntries()}disconnectedCallback(){super.disconnectedCallback(),HakuNeko.BookmarkPlugin.Entries.Unsubscribe(this.BookmarksChanged),HakuNeko.PastedClipboardURL.Unsubscribe(this.PastedClipboardUrlChanged)}ContainerChanged(){let e=this.Container?.Entries.Value.find(e=>e.Identifier===this.Selected?.Identifier);this.Selected=e??this.Selected,this.FilterEntries()}MatchChanged(){this.FilterEntries()}SelectedChanged(e,t){t!==e&&(this.BookmarksChanged(HakuNeko.BookmarkPlugin.Entries.Value,HakuNeko.BookmarkPlugin),this.$emit(`selectedChanged`,this.Selected))}ExpandedChanged(){this.dropdown&&(this.dropdown.style.display=this.Expanded?`block`:`none`,this.searchbox.Focus())}async FilterEntries(){this.filtered=this.Container?.Entries?.Value.filter(e=>this.Match(e.Title))??[]}SelectEntry(e){this.Selected=e,this.Expanded=!1,b.notify(this,`expanded`)}async UpdateEntries(e){e.stopPropagation();let t=this.Container;try{this.updating.includes(t.Identifier)||(this.updating=[...this.updating,t.Identifier],await t?.Update(),this.ContainerChanged())}catch(e){console.warn(e)}finally{this.updating=this.updating.filter(e=>e!==t.Identifier)}}async AddBookmark(e){e.stopPropagation(),this.Selected&&await HakuNeko.BookmarkPlugin.Add(this.Selected)}async RemoveBookmark(e){if(e.stopPropagation(),this.Selected&&HakuNeko.BookmarkPlugin.IsBookmarked(this.Selected)){let e=HakuNeko.BookmarkPlugin.Find(this.Selected);await HakuNeko.BookmarkPlugin.Remove(e)}}async PasteClipboard(e){e.stopPropagation();let t=await navigator.clipboard.readText();try{HakuNeko.PastedClipboardURL.Value=new URL(t)}catch(e){console.warn(e)}}};V([X],MediaTitleSelect.prototype,`Localization`,void 0),V([S],MediaTitleSelect.prototype,`Container`,void 0),V([S],MediaTitleSelect.prototype,`Match`,void 0),V([S],MediaTitleSelect.prototype,`filtered`,void 0),V([S],MediaTitleSelect.prototype,`Selected`,void 0),V([S],MediaTitleSelect.prototype,`Expanded`,void 0),V([S],MediaTitleSelect.prototype,`updating`,void 0),V([S],MediaTitleSelect.prototype,`bookmark`,void 0),V([S],MediaTitleSelect.prototype,`scanning`,void 0),V([S],MediaTitleSelect.prototype,`pasting`,void 0),MediaTitleSelect.define({name:`fluent-media-title-select`,template:Qe,styles:Ye});var $e=[`padding: var(--spacingHorizontalXS);`,`border-top: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle);`,`gap: var(--spacingHorizontalXS);`,`display: grid;`,`align-items: center;`,`grid-template-rows: min-content;`,`grid-template-columns: min-content 1fr min-content;`].join(` `),Z=[`overflow: hidden;`,`white-space: nowrap;`,`text-overflow: ellipsis;`].join(` `),et=[Z,`display: flex;`,`visibility: hidden;`].join(` `),tt=g`

    :host {
        display: grid;
        grid-template-columns: auto;
        grid-template-rows: min-content min-content minmax(0, 1fr);
    }

    #header {
        padding: var(--spacingHorizontalS);
        background-color: var(--colorNeutralBackground4);
        display: grid;
        align-items: center;
        grid-template-rows: auto;
        grid-template-columns: minmax(0, 1fr) max-content;
    }

    #title {
        text-transform: uppercase;
        font-weight: bold;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    #controls {
        display: flex;
        align-items: center;
    }

    #controls .hint {
        color: var(--colorNeutralForeground4);
        margin-left: var(--spacingHorizontalXS);
        margin-right: var(--spacingHorizontalXS);
    }

    #searchcontrol {
        padding: var(--spacingHorizontalS);
        border-top: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle);
        border-bottom: var(--strokeWidthThin) solid var(--colorNeutralStrokeSubtle);
        background-color: var(--colorNeutralBackground4);
    }

    #button-update-entries.updating svg {
        animation: spinning 1.5s linear infinite;
    }

    @keyframes spinning {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    #entries {
        padding: 0;
        margin: 0;
    }
`;function CreateItemTemplate(e){return y`
        <div class="entry" style="${$e}" onmouseover="this.querySelector('div.controls').style.visibility = 'visible'" onmouseout="this.querySelector('div.controls').style.visibility = 'hidden'">
            <div style="${Z}"><!-- <fluent-checkbox></fluent-checkbox> --></div>
            <div style="${Z}">${e=>e.Title}</div>
            <div class="controls" style="${et}">
                <fluent-button
                    icon-only
                    appearance="transparent"
                    title="${()=>e.Localization.Locale.Frontend_FluentCore_MediaItemList_PreviewButton_Description()}"
                    :innerHTML=${()=>ge}
                    @click=${t=>e.ShowPreview(t)}>
                </fluent-button>
                <fluent-button
                    icon-only
                    appearance="transparent"
                    title="${()=>e.Localization.Locale.Frontend_FluentCore_MediaItemList_DownloadButton_Description()}"
                    :innerHTML=${()=>T}
                    @click=${t=>e.Download(t)}>
                </fluent-button>
            </div>
        </div>
    `}var nt=y`
    <div id="header">
        <div id="title">${e=>e.Localization.Locale.Frontend_FluentCore_MediaItemList_Heading()}</div>
        <div id="controls">
            <div class="hint">${e=>e.filtered?.length??`┄`}／${e=>e.Entries?.length??`┄`}</div>
            <fluent-button
                icon-only
                id="button-update-entries"
                appearance="transparent"
                class="${e=>e.updating.includes(e.Container?.Identifier)?`updating`:``}"
                title="${e=>e.Localization.Locale.Frontend_FluentCore_MediaTitleSelect_UpdateEntriesButton_Description()}"
                ?disabled=${e=>!e.Container||e.updating.includes(e.Container?.Identifier)}
                :innerHTML=${()=>D}
                @click=${(e,t)=>e.UpdateEntries(t.event)}>
            </fluent-button>
        </div>
    </div>
    <div id="searchcontrol">
        <fluent-searchbox allowcase allowregex @predicate=${(e,t)=>e.Match=t.event.detail}></fluent-searchbox>
    </div>
    <fluent-lazy-scroll id="entries" :Items=${e=>e.filtered} :Template=${e=>CreateItemTemplate(e)}></fluent-lazy-scroll>
`,MediaItemList=class extends z{constructor(...e){super(...e),this.Entries=[],this.Match=()=>!0,this.filtered=[],this.updating=[]}ContainerChanged(){this.Entries=this.Container?.Entries.Value??[]}EntriesChanged(){this.FilterEntries()}MatchChanged(){this.FilterEntries()}async FilterEntries(){this.filtered=this.Entries?.filter(e=>this.Match(e.Title))??[]}async UpdateEntries(e){e.stopPropagation();let t=this.Container;try{this.updating.includes(t.Identifier)||(this.updating=[...this.updating,t.Identifier],await t?.Update(),this.ContainerChanged())}catch(e){console.warn(e)}finally{this.updating=this.updating.filter(e=>e!==t.Identifier)}}async ShowPreview(e){this.$emit(`previewClicked`,e)}async Download(e){try{await this.SettingsManager.SettingMediaDirectory.EnsureAccess()}catch(e){return alert(e.message??e)}await HakuNeko.DownloadManager.Enqueue(e)}};V([X],MediaItemList.prototype,`Localization`,void 0),V([K],MediaItemList.prototype,`SettingsManager`,void 0),V([S],MediaItemList.prototype,`Container`,void 0),V([S],MediaItemList.prototype,`Entries`,void 0),V([S],MediaItemList.prototype,`Match`,void 0),V([S],MediaItemList.prototype,`filtered`,void 0),V([S],MediaItemList.prototype,`updating`,void 0),MediaItemList.define({name:`fluent-media-item-list`,template:nt,styles:tt});var rt=g`

    :host {
        display: flex;
        flex-direction: column;
    }

    #heading {
        background-color: var(--colorNeutralBackground2);
        padding: var(--spacingHorizontalXS);
        gap: var(--spacingHorizontalS);
        display: grid;
        align-items: center;
        grid-template-columns: max-content 1fr max-content;
    }

    #caption {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    #content {
        width: 100%;
        height: 100%;
        overflow-y: scroll;
        text-align: center;
    }
`,it=y`
    <div id="heading">
        <fluent-button icon-only appearance="transparent" title="${e=>e.Localization.Locale.Frontend_FluentCore_Preview_CloseButton_Description()}" :innerHTML=${()=>L} @click=${e=>e.Entry=void 0}></fluent-button>
        <div id="caption">${e=>e.Entry?.Title??``}</div>
        <div></div>
    </div>
    <div id="content">
        ${h(e=>e.Entry instanceof we,y`${v(e=>e.items,y`<fluent-media-item-page :Item=${e=>e}></fluent-media-item-page>`,{recycle:!1})}`)}
    </div>
`,MediaItemPreview=class extends z{async EntryChanged(){this.Entry?.Entries?.Value.length===0&&(this.items=[],await this.Entry?.Update()),this.items=this.Entry?.Entries.Value??[],this.$emit(`entryChanged`,this.Entry)}};V([X],MediaItemPreview.prototype,`Localization`,void 0),V([S],MediaItemPreview.prototype,`items`,void 0),V([S],MediaItemPreview.prototype,`Entry`,void 0),MediaItemPreview.define({name:`fluent-media-item-preview`,template:it,styles:rt});function noop(){}var at=g`

    :host {
        display: inline-grid;
        margin: var(--spacingHorizontalS);
        /* imitiate fluent-card as it is not yet implemented ... */
        border: var(--strokeWidthThin) solid var(--neutral-stroke-layer-rest);
        border-radius: var(--borderRadiusXLarge);
        box-shadow: var(--shadow4);
        overflow: clip;
    }

    a {
        color: var(--colorBrandForegroundLink);
        text-decoration: none;
    }

    .info {
        padding: var(--spacingHorizontalXS);
        background-color: var(--colorNeutralBackground4);
        color: var(--colorNeutralForeground4);
    }

    .thumbnail {
        width: 320px;
        height: 320px;
    }

    .link {
        display: block;
    }

    .spinner {
        display: grid;
        align-items: center;
        justify-items: center;
    }
`,ot=y`
    <a target="_blank" href="${e=>e.Item?.Link}" title="${e=>e.Item?.Link}">
        ${e=>e.Info??`┄`}
    </a>
`,st=y`
    <a class="thumbnail link" target="_blank" href="${e=>e.Image}" title="${e=>e.Image}">
        <fluent-image fit="contain" shape="square">
            <img src="${e=>e.Image}" />
        </fluent-image>
    </a>
`,ct=y`
    <div class="thumbnail spinner">
        <fluent-spinner size="huge"></fluent-spinner>
    </div>
`,lt=y`
    <div class="info">
        ${e=>e.Item&&e.Info?ot:y`┄`}
    </div>
    ${e=>e.Image?st:ct}
`,MediaItemPage=class extends z{constructor(...e){super(...e),this.abort=noop,this.Image=void 0,this.Info=void 0}disconnectedCallback(){super.disconnectedCallback(),this.Item=void 0}ItemChanged(){this.abort(),this.Image=void 0,window.clearTimeout(this.timerLoadPage),this.timerLoadPage=window.setTimeout(()=>{this.Item&&(window.clearTimeout(this.timerLoadPage),this.LoadPage())},500)}ImageChanged(e,t){e?.startsWith(`blob:`)&&URL.revokeObjectURL(e),t?.startsWith(`blob:`)||(this.Info=void 0)}async LoadPage(){try{let e=new AbortController;this.abort=()=>{this.abort=noop,e.abort()};let t=await this.Item.Fetch(te.High,e.signal);if(this.abort=noop,!t||e.signal.aborted)return;this.Image=URL.createObjectURL(t),this.Info=`${t.type} @ ${t.size.toLocaleString(`en-US`,{useGrouping:!0})}`}catch(e){console.warn(e)}finally{this.abort=noop}}};V([S],MediaItemPage.prototype,`Item`,void 0),V([S],MediaItemPage.prototype,`Image`,void 0),V([S],MediaItemPage.prototype,`Info`,void 0),MediaItemPage.define({name:`fluent-media-item-page`,template:lt,styles:at});var ut=g`
    :host {
        display: block;
    }

    #searchpattern {
        display: block;
        max-width: unset !important;
    }

    #searchpattern [slot="start"] svg {
        height: 1em;
    }

    #searchpattern [slot="start"] {
        display: flex;
        align-items: center;
    }

    #searchpattern [slot="end"] {
        display: flex;
        align-items: center;
    }
`,dt=y`
    <fluent-button icon-only size="small" appearance="${e=>e.CaseEnabled?`outline`:`transparent`}" title="${e=>e.Localization.Locale.Frontend_FluentCore_SearchBox_CaseSenstiveToggleButton_Description()}" :innerHTML=${()=>he} @click=${e=>e.CaseEnabled=!e.CaseEnabled}></fluent-button>
`,ft=y`
    <fluent-button icon-only size="small" appearance="${e=>e.RegexEnabled?`outline`:`transparent`}" title="${e=>e.Localization.Locale.Frontend_FluentCore_SearchBox_CaseRegularExpressionToggleButton_Description()}" :innerHTML=${()=>I} @click=${e=>e.RegexEnabled=!e.RegexEnabled}></fluent-button>
`,pt=y`
    <fluent-text-input id="searchpattern" ${m(`searchpattern`)} appearance="outline" placeholder="${e=>e.placeholder}" :value=${e=>e.Needle} @input=${(e,t)=>e.Needle=t.eventTarget().value}>
        <div slot="start" :innerHTML=${()=>w}></div>
        <div slot="end">
            <fluent-button icon-only size="small" appearance="transparent" title="${e=>e.Localization.Locale.Frontend_FluentCore_SearchBox_ClearButton_Description()}" :innerHTML=${()=>j} @click=${e=>e.Needle=``}></fluent-button>
            ${h(e=>e.AllowCase,dt)}
            ${h(e=>e.AllowRegex,ft)}
        </div>
    </fluent-text-input>
`,SearchBox=class extends z{constructor(...e){super(...e),this.event=`predicate`,this.placeholder=``,this.Needle=``,this.AllowCase=!1,this.CaseEnabled=!1,this.AllowRegex=!1,this.RegexEnabled=!1}NeedleChanged(){this.UpdatePredicate()}AllowCaseChanged(){this.UpdatePredicate()}CaseEnabledChanged(){this.UpdatePredicate()}AllowRegexChanged(){this.UpdatePredicate()}RegexEnabledChanged(){this.UpdatePredicate()}Focus(){return this.searchpattern.focus()}UpdatePredicate(){try{if(!this.Needle)this.$emit(this.event,()=>!0);else if(this.AllowRegex&&this.RegexEnabled){let e=new RegExpSafe(this.Needle,this.AllowCase&&this.CaseEnabled?void 0:`i`);this.$emit(this.event,t=>e.test(t))}else if(this.AllowCase&&this.CaseEnabled)this.$emit(this.event,e=>e.includes(this.Needle));else{let e=this.Needle.toLocaleLowerCase();this.$emit(this.event,t=>t.toLowerCase().includes(e))}}catch{}}};V([X],SearchBox.prototype,`Localization`,void 0),V([x],SearchBox.prototype,`placeholder`,void 0),V([S],SearchBox.prototype,`Needle`,void 0),V([x({mode:`boolean`})],SearchBox.prototype,`AllowCase`,void 0),V([S],SearchBox.prototype,`CaseEnabled`,void 0),V([x({mode:`boolean`})],SearchBox.prototype,`AllowRegex`,void 0),V([S],SearchBox.prototype,`RegexEnabled`,void 0),SearchBox.define({name:`fluent-searchbox`,template:pt,styles:ut});var Q=_.createContext(),mt=g`

    #settings {
        display: grid;
        align-items: center;
        grid-template-columns: max-content max-content;
        gap: var(--spacingHorizontalS);
    }
`,ht=y`
    <fluent-text-input type="text" value=${e=>e.Value} @change=${(e,t)=>e.Value=t.eventTarget().value}></fluent-text-input>
`,gt=y`
    <fluent-text-input type="password" value=${e=>e.Value} @change=${(e,t)=>e.Value=t.eventTarget().value}></fluent-text-input>
`,_t=y`
    <fluent-number-field min=${e=>e.Min} max=${e=>e.Max} value=${e=>e.Value} @change=${(e,t)=>e.Value=t.eventTarget().value}></input>
`,vt=y`
    <fluent-checkbox style="display: inline-block;" :checked=${e=>e.Value} @change=${(e,t)=>e.Value=t.eventTarget().checked}></fluent-checkbox>
`;function CreateChoiceOptionTemplate(e,t){return y`
        <fluent-option value=${e=>e.key} selected=${e=>e.key===t.Value}>${t=>e.Localization.Get(t.label)}</fluent-option>
    `}function CreateChoiceTemplate(e){return y`
        <fluent-dropdown type="dropdown" id=${e=>e.ID} @change=${(e,t)=>e.Value=t.eventTarget().value}>
            <fluent-listbox>
                ${v(e=>e.Options,t=>CreateChoiceOptionTemplate(e,t))}
            </fluent-listbox>
        </fluent-dropdown>
    `}var $=y`
    <fluent-text-input type="text" readonly id=${e=>e.ID} value=${e=>e.Value?.name}>
        <fluent-button slot="end" icon-only size="small" appearance="transparent" :innerHTML=${()=>_e} @click=${(e,t)=>t.parent.SelectDirectory(e)}></fluent-button>
    </fluent-text-input>
`;function CreateSettingTemplate(r){return y`
        <div title=${e=>r.Localization.Locale[e.Description]()}>${e=>r.Localization.Get(e.Label)}</div>
        ${h(e=>e instanceof o,ht)}
        ${h(e=>e instanceof ee,gt)}
        ${h(e=>e instanceof n,_t)}
        ${h(e=>e instanceof i,vt)}
        ${h(e=>e instanceof t,CreateChoiceTemplate(r))}
        ${h(t=>t instanceof e,$)}
    `}var yt=y`
    <fluent-dialog type="modal" ${m(`dialog`)}>
        <fluent-dialog-body>
            <div slot="title">${e=>e.Localization.Locale.Frontend_FluentCore_SettingsDialog_Title()}</div>
            <div id="settings">
                ${v(e=>e.Settings,CreateSettingTemplate)}
            </div>
            <fluent-button slot="action" appearance="accent" @click=${e=>e.dialog.hide()}>
                ${e=>e.Localization.Locale.Frontend_FluentCore_SettingsDialog_CloseButton_Label()}
            </fluent-button>
        </fluent-dialog-body>
    </fluent-dialog>
`,SettingsDialog=class extends z{constructor(...e){super(...e),this.Settings=[]}connectedCallback(){super.connectedCallback(),this.SettingsManager.ShowSettingsDialog=(...e)=>{this.Settings=e,this.dialog.show()}}async SelectDirectory(e){try{let t=await this.InteractiveFileContentProvider.PickDirectory(e.Value??`documents`)??e.Value;this.shadowRoot.querySelector(`#`+e.ID).value=t.name,e.Value=t}catch(e){if(this.InteractiveFileContentProvider.IsAbortError(e))return;throw e}}};V([Q],SettingsDialog.prototype,`InteractiveFileContentProvider`,void 0),V([X],SettingsDialog.prototype,`Localization`,void 0),V([K],SettingsDialog.prototype,`SettingsManager`,void 0),V([S],SettingsDialog.prototype,`Settings`,void 0),SettingsDialog.define({name:`fluent-settings-dialog`,template:yt,styles:mt});var bt=g`

    :host {
        display: block;
        overflow-x: hidden;
        overflow-y: scroll;
    }
`,xt=y`
    ${v(e=>e.visibles,e=>e.Template)}
    <div ${m(`trigger`)}></div>
`,LazyScroll=class extends z{constructor(...e){super(...e),this.observer=new IntersectionObserver(([e])=>e.isIntersecting&&this.LoadNext(100)),this.visibles=[],this.LoadNext=function(e){this.visibles.length<this.Items.length&&window.requestAnimationFrame(()=>{this.visibles=this.Items?.slice(0,this.visibles.length+e)??[]})}.bind(this)}connectedCallback(){super.connectedCallback(),this.observer.observe(this.trigger)}disconnectedCallback(){super.disconnectedCallback(),this.observer.disconnect()}ItemsChanged(){this.visibles=[],this.LoadNext(100)}};V([S],LazyScroll.prototype,`Template`,void 0),V([S],LazyScroll.prototype,`visibles`,void 0),V([S],LazyScroll.prototype,`Items`,void 0),LazyScroll.define({name:`fluent-lazy-scroll`,template:xt,styles:bt});var FluentCore=class{RegisterDependencies(e){let t=_.getOrCreateDOMContainer(document.body);t.register(l.singleton(K,SettingsManager)),t.register(l.singleton(X,Y)),t.register(l.instance(J,new WindowManager(e))),t.register(l.singleton(Q,Te))}async Render(e,t){this.RegisterDependencies(t),e.appendChild(new q)}},St=new FluentCore;export{St as default};