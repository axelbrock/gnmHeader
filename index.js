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
      active: false,
      alerts: [],
      collapsed: true,
      debug: true

    }

    this.affiliate = props.affiliate;
    this.cacheDuration = 60 * 1000;
    this.slideDelay = 10 * 1000;
    this.transitionSpeed = 600;
    this.bannerChecker = null;
    this.bannerSlider = null;


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


    if(this.state.debug)
        this.updateAlerts(banners_fake);
    else{
      this.getDataIfNeeded();
      this.bannerChecker = setInterval(()=>{this.getDataIfNeeded()},this.cacheDuration);
    }
    this.bannerSlider = setInterval(()=>{this.slideBanner()},this.slideDelay);


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

          this.updateAlerts(res);

        })



  }

  updateAlerts(alerts){

    alerts.map((a,i) =>{
      switch(a.BannerTypeId){
        case 0: a.class = "alert-breaking" ; break; //Breaking News
        case 1: a.class = "alert-closing" ; break; //School Closings
        case 3: a.class= "alert-announcement" ; break; //General Announcement
        case 5: a.class= "alert-streaming" ;break; //Livestream
        case 15: a.class= "alert-earthquake" ;break; //Earthquake
        default: a.class='' ;

      }

      a.activeOrder = i;

      return null;
    })

    this.setState({
                    alerts: alerts,
                    active: alerts.length > 0 ? true : false
                  })
    if(typeof window == "object")
      window.onresize = this.makeSpaceForHeader;


  }

  slideBanner(){
    if(!this.state.collapsed)
      return null
    this.setState(function(prevState){
      if (prevState.alerts.length == 0)
        return
      let newalerts = prevState.alerts.map((el,i,array)=>{
        el.activeOrder = el.activeOrder != 0 ? el.activeOrder - 1 : array.length - 1 ;
        return el
      })


      return{
        alerts: newalerts,
        animating: true
      }
    })
  }

  componentDidUpdate(prevProps, prevState){
    console.log('this.state.active', this.state.active);
    console.log('prevState.active',prevState.active)
    if(this.state.active != prevState.active || this.state.collapsed != prevState.collapsed)
      this.makeSpaceForHeader();
  }

  componentWillUnmount(){
    clearInterval(this.bannerChecker);
    clearInterval(this.bannerSlider);
    this.makeSpaceForHeader();

  }

  makeSpaceForHeader = () =>{
    /* css transition for this effect can be found both in Banner.css and global.css */
    console.log('made space for header')
    var banner_height = this.state.active ? (this.state.collapsed?  40 :  this.state.alerts.length*40 ) : 0;

    var header_height = 101;
    if(typeof document.getElementById('gnm-header-without-banner') == "object"){
      var header_height = document.getElementById('gnm-header-without-banner').offsetHeight;

    }



    let new_padding = (header_height + banner_height + 8) + 'px';

    console.log('new padding '+ new_padding )
    /* really hate touching the DOM, but I don't see any way out of this */
    if(document.getElementById('gnm-main-body'))
		  document.getElementById('gnm-main-body').style.paddingTop = new_padding;
      /* for frankly layout only */
    if(document.querySelector(".PageGrid.PageBody.container"))
      document.querySelector(".PageGrid.PageBody.container").style.paddingTop = new_padding;
	}




  toggleCollapsed(){
    this.setState((prevState)=>{
      return { collapsed: !prevState.collapsed }
    })

  }

  animatedStyle = (a,i) => {
    if(this.state.collapsed){
      let transformPercent = 0;
      let zIndex = "-1"
      if(a.activeOrder == this.state.alerts.length - 1){
        transformPercent = 100;
        zIndex = "1";
      }
      if(a.activeOrder == 0){
          zIndex = "1";
      }

      return{
                zIndex: (this.state.alerts.length - a.activeOrder).toString(),

                transition :"z-index "+6*this.transitionSpeed+"ms linear,  transform " + this.transitionSpeed + "ms ease-in-out",
                transform: "translate3d(0,"+ transformPercent+ "%,0)"
              }
    }
    else{


      return {  opacity: "1",
                zIndex: (this.state.alerts.length - a.activeOrder).toString(),
                transition :"z-index 0ms, transform " + this.transitionSpeed + "ms ease-in-out",
                transform: "translate3d(0,"+100*a.activeOrder+"%,0)"
              }
    }

  }



 render(){
   return(
     <div className=" gnm-banner">


         <div id='gnm-banner-wrapper'
              className={"  gnm-banner-main gnm-banner " + (this.state.active ? "active" : "inactive")}
              style={this.state.collapsed? {}: {height: this.state.alerts.length*40 + 'px'}} >
           <div className="container " >

            <button className="show-all" onClick={this.toggleCollapsed.bind(this)}>
                <span className={"glyphicon glyphicon-chevron-up " +(this.state.collapsed? "collapsed":"")}></span>
            </button>

            <div className="alert-container">
               {
                 this.state.alerts.map((a,i) => {
                   return(
                     <div key={i}
                          className={"item "  }
                          style={this.animatedStyle(a,i)}
                         role="option">

                         <a className={"alert text-capitalize " + a.class + (a.activeOrder == 0 ? " active" : "")} role="alert" href={a.Link}>

                             <div className="line-clamp ">
                                 <span className="alert-name">
                                   <span className="text-uppercase">{a.Title}:</span>
                                   <span>{a.BannerTypeId != 1 ? a.Description:

                                       (<span className="sponsor">
                                         <span className="hidden-xs">Sponsored </span>By Osage RiverSpirit Casino & Resort
                                       </span>)
                                   }</span>
                                </span>
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

    this.toggleParent = props.toggle;
    this.subNavOpenInhibitor = false;
    this.subNavOpenTimer = null;
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


  toggleSubMenu( i){

    /* don't forget to close the others */
    this.setState( (prevState) => {
      if(prevState.items[i].active){

         prevState.items.map(item=>{item.active = false})
      }
      else{
        prevState.items.map(item=>{item.active = false});
        prevState.items[i].active = true;
      }
      return {
        items: prevState.items
      }
    })

  }

  toggleMenu = () => {
    this.toggleParent();
    this.setState( function(prevState){
      return {
        open : !prevState.open
      }
    })


  }

  toggleMouseOver(i,e) {


      this.toggleSubMenu(i);
      // this.subNavOpenInhibitor = true;
      // this.subNavOpenTimer = setTimeout( ()=>{this.subNavOpenInhibitor = })
  }



  render(){
    return(
      <div className={" gnm-mobile-mega-nav " + (this.state.open ? "active" : "" ) }>
        <div className="container">
          <div className="row">
            <div className="col-lg-3 col-md-4 col-sm-3 col-xs-6 dark-background first-column">
                <div className="row lift">
                  <div className="col-xs-12 search-container">
                    <div className="input-group">
                      <input type="text" className="form-control" placeholder="Search"/>
                      <span className="input-group-btn">
                        <button className="btn btn-default" type="button">
                          <span className="glyphicon glyphicon-search"></span>
                        </button>
                      </span>
                    </div>
                  </div>
                </div>


                {this.state.items.map((navitem, i) => {
                  return (
                    <div key={i}    onClick={this.toggleSubMenu.bind(this,i)}
                      >
                      <div className=" row lift">
                        <div className={" exclusive-hover category col-xs-12 hover-color " + (navitem.active? "active":"")}  >
                            <div className="row">
                              <div className="col-xs-9 pointer" >
                                <span  >{navitem.title}</span>
                              </div>
                              <div className="col-xs-3 pointer"  >
                                  <span className={" glyphicon glyphicon-chevron-right " + (navitem.active? "spun": "")} ></span>
                              </div>
                            </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {this.state.items.map((navitem, i) => {
                  return(
                    <div key={i} className={" dark-background subcategory-page " + (navitem.active? "active " : "inactive") }>

                        <div className={"col-xs-12 inner-border" }>
                          <div className="row hover-color  category subcategory top-level-route">
                            <a href="#">
                              <div className="col-xs-12 tiny-padding-top ">
                                <span>{navitem.title + " Home"}</span>
                              </div>
                            </a>
                          </div>

                          {navitem.subItems.map((subitem, j)=>{
                            return (
                              <div key={j} className="row hover-color  category subcategory">
                                <a href="#" onClick={this.toggleMenu} >
                                  <div className="col-xs-12 tiny-padding-top">
                                    <span href="#" >{subitem.title}</span>
                                  </div>
                                </a>
                              </div>
                            );
                          })}

                        </div>

                    </div>
                  )
                })}
                <div className="subcategory-page dark-background "></div>



            </div>

          </div>

        </div>
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

    this.ajax(url, (res)=>{
      this.buildWeather(res);
      this.lastChecked = Date.now();
    })
	}


  render(){ //REQUIRED
    return (<div className="gnm-current-conditions ">
              <div className="row ">

                <div className="col-xs-12 temperature-sm ">
                  <img className="weather-icon-sm" src={this.state.conditionIcon} />
                  <div className="current-temp">{this.state.temp}&deg;</div>
                
                  <div className="radar-container visible-lg-block">
                    <a href="#">
                      <img className="radar-img" src={this.state.radarImg} alt="radar image"/>
                    </a>
                    <div>
                      <a href="#" className="map-link">Tulsa, OK <span className="glyphicon glyphicon-map-marker"></span></a>
                    </div>
                  </div>

                </div>

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



  toggleMobileMegaNav = () => {
    this.setState({
      mobileMegaNavOpen: !this.state.mobileMegaNavOpen
    })
  }



	render(){
		return(
      <div className='gnm-header '>
					  <Banner affiliate={this.affiliate} ></Banner>
					<div id='gnm-header-without-banner'>
						<div className="container">
		          <div className="header-top row ">
								<div className="col-xs-3 col-sm-2 col-md-1 col-lg-1 button-container">
									<button className="show-live ">
										<div className="">Live</div>
										<span className="middot"></span>
									</button>
									<button  onClick={ this.toggleMobileMegaNav} className={"dark-icon-bar-container " + (this.state.mobileMegaNavOpen? "active" : "")}>
										<div className="dark-icon-bar"></div>
										<div className="dark-icon-bar"></div>
										<div className="dark-icon-bar"></div>
									</button>
								</div>
								<div className="col-xs-2 col-md-2 col-lg-2">
								</div>

								<div className="col-xs-4 visible-xs-block">
								</div>
								<div className="col-sm-6 visible-sm-block">
									 <img className="small-ad" src='img/ad640x100.jpg'></img>
								</div>
								<div className="col-md-7 visible-md-block">
									 <img className="big-ad" src='img/ad640x100.png'></img>
								</div>
								<div className=" col-lg-7 visible-lg-block" >
								 <img className="big-ad" src='img/ad728x90.jpg'></img>
							 </div>
		            <div className="col-xs-3 col-sm-2 col-md-2 col-lg-2" >
									<CurrentConditions affiliate={this.affiliate}></CurrentConditions>
		            </div>
		          </div>
						</div>

					</div>
					<MobileMegaNav items={this.state.mobileMegaNavItems} open={this.state.mobileMegaNavOpen} toggle={this.toggleMobileMegaNav}/>


      </div>
		);
	}
}




export default Header;
