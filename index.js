import React, { Component } from 'react';

const hasLocalStorage =(function hasLocalStorage(){
  let uid = new Date();
    try {
        localStorage.setItem(uid, uid);
        localStorage.removeItem(uid);
        return true;
    } catch (e) {
      return false;
    }
})()


class Banner extends Component{

  constructor(props){
    super(props)
    this.state = {
      alerts: [],
      active: false,
      expanded: false
    }
    this.affiliate = props.affiliate;
    this.cacheDuration = 60 * 1000;
    this.bannerChecker = null;
  }

  componentWillMount(){
		if(typeof window != "object"){
      if(process.env.HOME == '/Users/don'){
  			var BannerCache = require('../ServerCache/BannerCache.js')
  			this.updateAlerts(BannerCache.get()); //sorry
      }
		}
	}

  componentDidMount(){

    this.getDataIfNeeded();
    /* We are going to keep checking every minute, in case the browser is left open */
    this.bannerChecker = setInterval(()=>{this.getDataIfNeeded()},60000);
    if(typeof window == "object"){//on client
      if(window.jQuery)
        window.jQuery('#gnm-banner-carousel').carousel();
      window.onresize = this.makeSpaceForHeader;
    }

    this.makeSpaceForHeader();


  }

  getDataIfNeeded(){
    if(hasLocalStorage){
      let now = (new Date()).getTime();
      let currentdata = localStorage.getItem('banners');
      let current_expire = localStorage.getItem('banners_expire');
      if (!currentdata || current_expire < now){
        this.getData();
      } else {
        this.updateAlerts( JSON.parse(currentdata) );

      }
    } else {
      this.getData();
    }

  }

  ajax = (url,callback) => {
    let req = new XMLHttpRequest();
    req.open("GET", url);
    req.onload = function() {
        if (req.status === 200) {
            callback(req.response);
        } else {
            new Error(req.statusText);
        }
    };

    req.onerror = function() {
        new Error("Network error");
    };

    req.send();
  }

  getData(){
    this.ajax(`http://kotv.com/api/getBanners.aspx?station=${this.affiliate}&IsWeb=true`, (res) => {
      res = JSON.parse(res);
      if(!res.length){
        this.updateAlerts([]);
        return false;
      }
       if(hasLocalStorage){
         let cachetime = (new Date()).getTime() + this.cacheDuration;
         localStorage.setItem('banners', JSON.stringify(res));
         localStorage.setItem('banners_expire', cachetime);
       }
        this.updateAlerts(res)
        return true;
      })
  }

  updateAlerts(alerts){
    alerts.sort((a,b)=>{
      return parseInt(b.BannerTypeId,10) < parseInt(a.BannerTypeId,10)? 1 : -1
    })
    alerts.map((a,i) =>{
      switch(a.BannerTypeId){
        case 0: a.class = "alert-breaking" ; break; //Breaking News
        case 1: a.class = "alert-closing" ; break; //School Closings
        case 3: a.class= "alert-announcement" ; break; //General Announcement
        case 5: a.class= "alert-streaming" ;break; //Livestream
        case 15: a.class= "alert-earthquake" ;break; //Earthquake
        default: a.class='' ;

      }

      a.active = (i === 0 ? true : false ) //only to designate carousel states passively
      return null;
    })

    this.setState({
                    alerts: alerts,
                    active: alerts.length > 0 ? true : false
                  });

  }

  componentDidUpdate(prevProps, prevState){
      this.makeSpaceForHeader();
  }

  componentWillUnmount(){
    clearInterval(this.bannerChecker);
    this.makeSpaceForHeader();

  }

  makeSpaceForHeader(){
    /* css transition for this effect can be found both in Banner.css and global.css */
		let header_height = 146;
    if(window.innerWidth <= 992)
      header_height = 57;
    if(typeof this.state == 'object')
		  var banner_height = this.state.active ? 48 : 0 ;
    else /* this is only for rechecking during screen resize event */
      var banner_height = (typeof document.getElementById('gnm-banner-wrapper') == "object") ? document.getElementById('gnm-banner-wrapper').offsetHeight : 0;

    let new_padding = (header_height + banner_height + 8) + 'px';
    /* really hate touching the DOM, but I don't see any way out of this */
    if(document.getElementById('gnm-main-body'))
		  document.getElementById('gnm-main-body').style.paddingTop = new_padding;
      /* for frankly layout only */
    if(document.querySelector(".PageGrid.PageBody.container"))
      document.querySelector(".PageGrid.PageBody.container").style.paddingTop = new_padding;
	}



  expandAlerts(){

    this.setState({
        active: false,
        expanded: true
    })
  }

 render(){
   return(
     <div className="gnm-banner-wrapper">

       <div id="gnm-banner-wrapper">
         <div id="gnm-banner-carousel" className={"carousel vertical slide  gnm-banner-main gnm-banner " + (this.state.active ? "active" : "inactive")} data-ride="gnm-banner-carousel" data-interval="7000">
             <div className="carousel-inner pull-left" role="listbox">
               {
                 this.state.alerts.map((a,i) => {
                   return(
                     <div key={i} className={"item "  + ( i === 0 ? "active" : "")} role="option">
                         <a className={"alert text-capitalize " + a.class} role="alert" href="#!FOO">
                             <div className="line-clamp ">
                                 <span className="alert-name"><span className="text-uppercase">{a.Title}:</span> {a.Description}</span>
                             </div>
                             <span className="sponsor">
                                 <span className="sponsor-notice">Sponsored by:</span>
                                 <span className="sponsor-name">Osage RiverSpirit Casino &amp; Resort</span>
                             </span>
                         </a>
                     </div>
                   )
                 })
               }

             </div>
             <button className="alert-count-area text-center pull-left" type="button" data-toggle="modal" data-target="#alert-list-modal">
                 <span className="alert-count badge" aria-describedby="alert-label">{this.state.alerts.length}</span>
                 <span className="alert-label alert-label-lg hidden-xs" >Total Alerts</span>
                 <span className="alert-label alert-label-sm hidden-sm hidden-md hidden-lg" aria-hidden="true" role="presentation">ALERTS</span>
             </button>
         </div>

         <div className={"row expanded-alerts " + (this.state.expanded ? "expanded" : "hidden")}>
            <div className="col-xs-12">
              {
                this.state.alerts.map((a,i) => {
                  return(
                    <div key={i} >
                        <a  href="#!FOO">
                            <div className={"line-clamp " +  a.class}>
                                <span ><span className="text-uppercase">{a.Title}:</span> {a.Description}</span>
                            </div>
                            <span className="sponsor">
                                <span className="sponsor-notice">Sponsored by:</span>
                                <span className="sponsor-name">Osage RiverSpirit Casino &amp; Resort</span>
                            </span>
                        </a>
                    </div>
                  )
                })
              }
            </div>
         </div>
      </div>

       <div id="alert-list-modal" className="modal fade gnm-banner-modal gnm-banner"  tabIndex="-1" role="dialog" aria-labelledby="alert-list-label">
           <div className="modal-dialog modal-lg" role="document">
               <div className="modal-content">
                   <div className="modal-header">
                       <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                       <h4 className="modal-title" id="alert-list-label">Alerts</h4>
                   </div>
                   <div className="modal-body">
                       <div role="listbox">
                         {
                           this.state.alerts.map((a,i) => {
                             return(
                               <div key={i} className="item" role="option">
                                   <a className={"alert text-capitalize " + a.class} role="alert" href="#!FOO">
                                       <div className="line-clamp">
                                           <span className="alert-name"><span className="text-uppercase">{a.Title}</span> {a.Description}</span>
                                       </div>
                                   </a>
                               </div>
                             )
                           })
                         }
                       </div>
                   </div>
               </div>
           </div>
       </div>
     </div>


   )
 }


}


class MobileMegaNav extends Component {

  constructor(props){
    super(props)
    this.state ={
      open: props.open ? true : false,
      items: []
    }

  }

  componentWillReceiveProps(nextProps){
    /* it will not likely mount with the menu already */
    nextProps.items.forEach(i=>{
      i.active = false;
    })
    this.setState({
      items: nextProps.items,
      open: nextProps.open
    })

  }

  //
  // showSubMenu(e, itemCat){
  //   if(itemCat !== 'About Us'){
  //     e.preventDefault();
  //     jQuery('.subItems').removeClass('active');
  //     //jQuery(`.subItems[data-cat=${itemCat}]`).show();
  //     jQuery(`.subItems[data-cat=${itemCat}]`).addClass('active');
  //   }
  // }
  //
  // goBack(e){
  //   e.preventDefault();
  //   jQuery('.subItems').removeClass('active');
  // }


  render(){
    return(
      <div className={"container gnm-mobile-mega-nav " + (this.state.open ? "active" : "" ) }>
        <ul>
          {this.props.items.map((navitem, i) => {
            return (
              <li key={i} className="mainItems" data-category-name={navitem['title']}>
                <a href="#subnav" onClick={(e) => { this.showSubMenu(e, navitem['title']); }}>
                  <span>{navitem['title']}</span>
                  <i className="fa fa-chevron-right"></i>
                </a>
                <ul className="subItems" data-cat={navitem['title']}>
                  <li>
                    <a className="goback" href="#goback" onClick={(e) => { this.goBack(e); }}>
                      <i className="fa fa-chevron-left"></i>
                      <span>Back</span>
                    </a>
                  </li>
                  {navitem.subItems.map(function(navsubitem, j){
                    return (
                      <li key={j}>
                        <a href="#gotopage">{navsubitem.title}</a>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    )
  }

}

/* escape frankly deploy script with this text */import XML2JS from 'xml2js';



class CurrentConditions extends Component {

  constructor(props){ //gives us acces to props, fires long before page load
    super(props) //assigns props to this.props
    this.affiliate = props.affiliate;
    this.lastChecked = Date.now();
    this.state = {
			radarImg: `http://aws.kotv.com/MorHtml5/kotv/ssite/110x62_new/main_anim.gif?${(new Date()).getTime()}`,
      city: '',
      state: '',
      conditionIcon: '',
      temp: '',
      feelsLike: '',
			high: '',
      low: '',
			currentConditions: [],
		}
  }

  ajax = (url,callback) => {
    let req = new XMLHttpRequest();
    req.open("GET", url);
    req.onload = function() {
        if (req.status === 200) {
            callback(req.response);
        } else {
            new Error(req.statusText);
        }
    };
    req.onerror = function() {new Error("Network error")};
    req.send();
  }

  buildWeather = (data) =>{
    if(!data)
      return
		let parseString = XML2JS.parseString,
			forecasts = [], jsondata,
			parsefunc = parseString(data, {attrNameProcessors: [(name => "@" + name)], explicitArray: false, charkey: "#text", mergeAttrs: true}, function(err, result){ jsondata = result; }),
			maindata = jsondata["WxSources"],
			forecastdata = maindata["forecast"]["WxForecasts"],
			todaysforecast = forecastdata["WxForecast"][0],
			currentdata = maindata["conditions"]["sfc_ob"];

		this.setState({
			city: currentdata["location"]["#text"],
			state: currentdata["location"]["@region"],
			conditionIcon: 'http://ftpcontent.worldnow.com/griffin/gnm/testing/svg/day/' + currentdata["WxIconType"]["#text"] + '.svg',
			temp: currentdata["temp"]["#text"],
			feelsLike: currentdata["apparent_temp"]["#text"],
			high: todaysforecast["High"],
			low: todaysforecast["Low"]
		});
	}

  componentDidMount(){
    var stationID = this.affiliate == 'kotv'? 1 : 2 ;
    this.getCurrentConditions();
  }

  componentWillMount(){
		if(typeof window != "object"){
      if(process.env.HOME == '/Users/don'){
  			var CurrentConditionsCache = require('../ServerCache/CurrentConditionsCache.js')
  			this.buildWeather(CurrentConditionsCache.get())
      }

		}
	}

  getCurrentConditions(){
		var zip = this.affiliate == 'kotv'? 74120 : 73179;
		var stationID = this.affiliate == 'kotv'? 1 : 2 ;
		var url = `http://kotv.com/api/GetForecast.ashx?target=data&action=WxForecast2012&site=` + stationID + `&zip=` + zip;
		console.log('url current condisiotn' , url)
    this.ajax(url, (res)=>{
      this.buildWeather(res);
      this.lastChecked = Date.now();
    })
	}


  render(){ //REQUIRED
    return (<div className="gnm-current-conditions">
              <div className="row visible-lg-block visible-md-block">
                <div className="col-xs-12 current-conditions">
                  <div className="pull-right  hidden-md">
                    <span className="location-label">Current Conditions in </span>
                    <a href="#" className="location-link">{this.state.city}, {this.state.state} <span className="glyphicon glyphicon-map-marker"></span></a>
                  </div>
                </div>
              </div>
              <div className="row visible-lg-block visible-md-block">
                <div className="col-lg-2 col-md-5 weather-icon-container" >
                  <img className="weather-icon-lg pull-right" src={this.state.conditionIcon} />
                </div>
                <div className="col-lg-3 col-md-7 temperature" >
                  <div>{this.state.temp}&deg;</div>
                  <div className="feels-like" >Feels like {this.state.feelsLike}&deg;</div>
                </div>
                <div className="col-lg-2 hidden-md temperature-extremes text-center">
                  <div className="high-low"><span className="high-temperature-label">HIGH   </span>{this.state.high}</div>
                  <div className="high-low"><span className="low-temperature-label">LOW   </span>{this.state.low}</div>
                </div>
                <div className="col-lg-5 hidden-md radar-image">
                  <img src={this.state.radarImg} alt="radar image"/>
                </div>
              </div>
              <div className="row visible-sm-block visible-xs-block">
                <div className="temperature-sm pull-right"><img className="weather-icon-sm" src={this.state.conditionIcon} />{this.state.temp}&deg;</div>
              </div>
            </div>)
  }
}



var TempNav = [
		{"title": "Home", "url":"/"},
		{"title": "News", "url": "/category/112042/news", "subItems":[
			{"title": "6 Investigates", "url":"/category/175087/6-investigates"},
			{"title": "Crime", "url":"/category/161867/crime"},
			{"title": "Strange News", "url":"/category/13544/strange-news"},
			{"title": "Health", "url":"/category/38921/health"},
			{"title": "Politics", "url":"/category/312367/politics"},
			{"title": "Special Coverage", "url":"/category/120892/special-coverage"},
			{"title": "Oklahoma Earthquakes", "url":"/category/225338/oklahoma-earthquakes"},
			{"title": "Links Mentioned", "url":"/category/120897/the-news-on-6-featured-links"},
			{"title": "Send Us News Tips", "url":"/category/121090/the-news-on-6-news-tips"}
		]},
		{"title": "Weather", "url": "/weather", "subItems":[
			{"title": "WARN Interactive Radar", "url":"/category/158741/warn-interactive-live-radar"},
			{"title": "U Control: Street Level", "url":"/category/121189/weather-radar"},
			{"title": "Watches & Warnings", "url":"/category/198135/u-control-weather-center"},
			{"title": "Osage SKYCAMS", "url":"/category/197844/skycam-network"},
			{"title": "Weather Safety", "url":"/category/120962/weather-safety"},
			{"title": "Alan's Bus Stop Forecast", "url":"/category/167399/alans-bus-stop-forecast"},
			{"title": "Fishing with Lacey", "url":"/category/320811/fishing-with-lacey"},
			{"title": "Lake Levels", "url":"/story/7724324/oklahoma-lake-levels"},
			{"title": "Traffic", "url":"/category/296298/news-on-6-traffic-map"}
		]},
		{"title": "Sports", "url": "/sports", "subItems":[
			{"title": "OU", "url":"/category/210006/oklahoma-sooners"},
			{"title": "OSU", "url":"/category/210005/oklahoma-state-cowboys"},
			{"title": "TU", "url":"/category/210002/tulsa-golden-hurricane"},
			{"title": "ORU", "url":"/category/210003/oral-roberts-golden-eagles"},
			{"title": "Thunder", "url":"/category/210007/oklahoma-city-thunder"},
			{"title": "Ford Sports Blitz", "url":"/category/219810/oklahoma-ford-sports-blitz"},
			{"title": "High School Football", "url":"/category/211942/high-school-football"},
			{"title": "Scores & Schedules", "url":"/category/216373/high-school-football-schedule-scoreboard"}
		]},
		{"title": "Video", "url": "/category/121535/video-page", "subItems":[
			{"title": "Watch CBS Shows", "url":"/link/554772/cbs-programming-catch-your-favorite-cbs-shows-old-favorites"},
			{"title": "Video Requests", "url":"/category/121092/the-news-on-6-video-requests"}
		]},
		{"title": "Recipes", "url": "/category/116530/recipes"},
		{"title": "Lifestyle", "url": "/category/68446/lifestyle", "subItems":[
			{"title": "Entertainment", "url":"/category/73801/entertainment"},
			{"title": "Money", "url":"/category/120652/money"},
			{"title": "Home & Family", "url":"/category/120651/home-family"},
			{"title": "Health", "url":"/category/38921/health"},
			{"title": "Food", "url":"/category/39546/food"},
			{"title": "Pets", "url":"/category/29878/pets"},
			{"title": "Technology", "url":"/category/58532/technology"},
			{"title": "Travel", "url":"/category/23748/travel"},
			{"title": "Beauty & Style", "url":"/category/76708/beauty-style"},
			{"title": "Auto", "url":"/category/41934/auto"},
			{"title": "VideoBytes", "url":"/category/120657/videobytes"},
			{"title": "Press Releases", "url":"/category/230909/press-releases"}
		]},
		{"title": "Community", "url": "/category/197945/community", "subItems":[
			{"title": "Weather Teller", "url":"/story/35036323/news-on-6-goes-old-school-with-nostalgic-weather-teller"},
			{"title": "Food For Kids", "url":"/category/208729/food-for-kids"},
			{"title": "TV Schedule", "url":"/story/11777977/tv-programming-schedule"},
			{"title": "AARP Caregivers", "url":"/category/300552/aarp-care-act"},
			{"title": "NOW Cable Listings", "url":"/category/277097/kotv-channels"}
		]},
		{"title": "Contests", "url": "/category/122577/contests", "subItems":[
			{"title": "Text & Win", "url":"/link/462221/text-win"},
			{"title": "Winners' Circle", "url":"/story/18813691/winners-circle"}
		]},
		{"title": "About Us", "url": "/category/156589/about-us", "subItems":[
			{"title": "Contact Us", "url":"/category/156589/about-us"},
			{"title": "Products", "url":"/category/191276/tools-and-features"},
			{"title": "Careers", "url":"/category/120924/employment-opportunities"}
		]}
	]


class Header extends Component{
	constructor(props){
		super(props);
    this.stationID = props.affiliate === 'kwtv' ? 2 : 1; //Dont beleive this has been set yet
    this.affiliate = props.affiliate;
		this.navigation_data = props.cache;
		this.state = {
      largeLogoUrl: 'http://ftpcontent.worldnow.com/kotv/test/don/build/img/bug.svg',
      smallLogoUrl: 'http://ftpcontent.worldnow.com/kotv/test/don/build/img/n6logo.svg',
			radarImg: `http://aws.kotv.com/MorHtml5/kotv/ssite/110x62_new/main_anim.gif?${(new Date()).getTime()}`,
			navItems: [],
      megaNavItems: [],
      mobileMegaNavItems : [],
      megaNavOpen: false,
      mobileMegaNavOpen: false,
      city: '',
      state: '',
      conditionIcon: '',
      temp: '',
      feelsLike: '',
			high: '',
      low: '',
			currentConditions: [],
			currentsConditionsTime: Date.now()
		}


	}

	ajax = (url,callback) => {
    let req = new XMLHttpRequest();
    req.open("GET", url);
    req.onload = function() {
        if (req.status === 200) {
            callback(req.response);
        } else {
            new Error(req.statusText);
        }
    };

    req.onerror = function() {
        new Error("Network error");
    };

    req.send();
  }


  componentDidMount(){
		if(typeof window == "object"){
			//this is only a test (but we are assuming it will be async)
			//window.jQuery.ajax({ url:'tempnav.json', dataType:'jsonp', jsonpCallback:'Nav'}).then((data) => { this.buildState(data.items); });
			// this.ajax('tempnav.json',(res) =>{
			// 	res = JSON.parse(res)
			// 	this.buildState(res)
			// })
			this.buildState(TempNav)
		}

  }

	componentWillMount(){
		if(typeof window != "object")
		 	if(process.env.HOME == '/Users/don'){
				/* problem here we can't run this on Frankly servers */
				var NavigationCache = require('../ServerCache/NavigationCache.js')
				this.buildState(NavigationCache.get()); //sorry
			}
	}




	buildState(navs){
		// let navs = data.items;

		let navItems = [];
		let megaNavItems = [];
    let mobileMegaNavItems = [];
		navs.map(function(item, i){
			if(typeof item.subItems !== "undefined" && item.title !== 'About Us' && item.title !== 'Video' && item.title != 'Contests'&& item.title !== 'Home'){
        megaNavItems.push(item);
      }
      if(typeof item.subItems !== "undefined" && item.title !== 'Home')
        mobileMegaNavItems.push(item);

			if(item.title !== 'About Us' && item.title !== 'Home'){
        navItems.push(item);
     }
		});

		this.setState({
			navItems: navItems,
			megaNavItems: megaNavItems,
      mobileMegaNavItems: mobileMegaNavItems
		});
	}



  toggleMegaNav = () => {
    this.setState({
      megaNavOpen: !this.state.megaNavOpen
    })
  }

  toggleMobileMegaNav = () => {
    this.setState({
      mobileMegaNavOpen: !this.state.mobileMegaNavOpen
    })
  }

  setActiveNav = (title) => {
    var navItems = this.state.navItems.map((a)=>{
      a.active = a.title == title ? true : false;
      return a;
    })
    this.setState({
      navItems: navItems,
      megaNavOpen: false
    })
  }



	// makeSpaceForHeader(){ /* really hate touching the DOM, but I don't see any way out of this */
	// 	let header_height = document.getElementById('gnm-header-without-banner').offsetHeight;
	// 	let banner_height = document.getElementById('gnm-banner-wrapper').offsetHeight;
	//
	// 	document.getElementById('gnm-main-body').style.marginTop = header_height + banner_height + 'px'
	// }

	render(){
		return(
      <div className='gnm-header container'>
        <Banner affiliate={this.affiliate} ></Banner>
        {/* For Large and Medium Screens */}
				<div id='gnm-header-without-banner'>
          <div className="header-top row visible-lg-block visible-md-block">
            <div className="col-lg-1 col-md-1 ">
              <img className={"logo-lg " + this.affiliate} src={this.state.largeLogoUrl} alt="Logo"  />

            </div>
            <div className="col-lg-8 col-md-9">
              <div className="header-ad"><div className="ad728x90"><img src="http://ftpcontent.worldnow.com/kotv/test/wx/ad728x90.jpg" /></div></div>
            </div>
            <div className="col-lg-3 col-md-2">
							<CurrentConditions affiliate={this.affiliate}></CurrentConditions>
            </div>
          </div>
        {/* Dark Bar For Small and Extra Small Screens */}
          <div className="header-top row visible-sm-block visible-xs-block">
            <div className="col-xs-1 col-sm-3" onClick={ this.toggleMobileMegaNav}>
              <div className='dark-icon-bar-container'>
                <div className="dark-icon-bar"></div>
                <div className="dark-icon-bar"></div>
                <div className="dark-icon-bar"></div>
              </div>
            </div>

            <div className="col-xs-7 col-sm-5">
              <img className="logo-sm" src={this.state.smallLogoUrl} alt="Logo"  />
            </div>

            <div className="col-xs-4">
							<CurrentConditions affiliate={this.affiliate}></CurrentConditions>
            </div>
          </div>
					{/* Red Bar for large and medium screens */}
  				<div className = "header-bottom visible-md-block visible-lg-block sticky" >
  						<ul className="nav-list-item">
                <li className={"pull-left nav-list-hamburger " + (this.state.megaNavOpen ? "active" : "")} onClick={this.toggleMegaNav}>
                  <a className="nav-list-link">
                    <div className="light-icon-bar"></div>
                    <div className="light-icon-bar"></div>
                    <div className="light-icon-bar"></div>
                  </a>
                </li>
  							{this.state.navItems.map((a, i)=>{
      								return (
      									<li key={a.title} className="pull-left">
      										<a  href={a.url} className={"nav-list-link " + (a.active ? "active" : "")} onClick={()=>{this.setActiveNav(a.title)}}>{a.title}</a>
      									</li>
      								);
      							}
                  )
                }
  							<li className="pull-left">
                  <a href="#" className="nav-list-link" id="searchbtn">
                    <span className="glyphicon glyphicon-search" aria-hidden="true"></span>
                  </a>
                </li>
  						</ul>

  				</div>

				</div>
				<div className={"mega-nav " + (this.state.megaNavOpen ? "open" : "closed")}>
					<MegaNav items={this.state.megaNavItems}></MegaNav>
				</div>
				<MobileMegaNav items={this.state.mobileMegaNavItems} open={this.state.mobileMegaNavOpen}/>





      </div>
		);
	}
}


  const MegaNav = (props) => {
    return <div className='mega-nav-inner'>
      {props.items.map(function(navitem, i){
        return (
          <ul key={i} >
            <li >
              <a href={navitem.url} className='strong'>{navitem.title}</a>
            </li>

            {navitem.subItems.map(function(navsubitem, j){
              return (
                <li key={j} >
                  <a href={navsubitem.url} className="weak">{navsubitem.title}</a>
                </li>
              );
            })}
          </ul>
        );
      })}
      <div className="clearfix"></div>
    </div>
  }




export default Header;
