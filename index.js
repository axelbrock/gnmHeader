import React, {Component} from 'react';

const hasLocalStorage = (function hasLocalStorage() {
  let uid = new Date();
  try {
    localStorage.setItem(uid, uid);
    localStorage.removeItem(uid);
    return true;
  } catch (e) {
    return false;
  }
})()

class Banner extends Component {
  constructor(props) {
    super(props)
    this.state = {
      active: false,
      alerts: [],
      collapsed: true,
      debug: false,
      schoolsClosed: false,
      schoolClosingUrl: '',
      live: false,
      notifications: 0
    }
    this.initTime = 0;
    this.affiliate = props.affiliate;
    this.cacheDuration = 60 * 1000;
    this.slideDelay = 10 * 1000;
    this.transitionSpeed = 600;
    this.bannerChecker = null;
    this.bannerSlider = null;
    this.UtilityBeltHeight = 30;
    this.serverSideRendered = false;
  }

  componentWillMount() {
    if (typeof window != 'object') {
      if (process.env.USER == 'don' || process.env.USER == 'ec2-user') {
        var BannerCache = require('../ServerCache/BannerCache.js')
        let alerts = BannerCache.get();
        this.updateAlerts(alerts);
      }
    } else {
      if (typeof window.gnmBannerCache != 'undefined') {
        this.serverSideRendered = true;
        this.updateAlerts(window.gnmBannerCache);
      }
    }
  }

  componentDidMount() {
    this.initTime = Date.now()
    if (this.state.debug)
      this.updateAlerts(banners_fake);
    else {
      if (!this.serverSideRendered)
        this.getDataIfNeeded();
      this.bannerChecker = setInterval(() => {
        this.getDataIfNeeded()
      }, this.cacheDuration);
    }
    this.bannerSlider = setInterval(() => {
      this.slideBanner()
    }, this.slideDelay);
    window.onresize = this.makeSpaceForHeader;
    this.makeSpaceForHeader()
  }

  getDataIfNeeded() {
    Ajax(`http://kotv.com/api/getBanners.aspx?station=${this.affiliate}&IsWeb=true`).then((res) => {
      this.updateAlerts(JSON.parse(res))
    })
  }

  updateAlerts(alerts) {
    let schoolsClosed = false;
    let schoolClosingUrl = '';
    let live = false;
    alerts.map((a, i) => {
      if (a.BannerTypeId == 1) {
        schoolsClosed = true;
        schoolClosingUrl = a.Link;
      }
      if (a.BannerTypeId == 5) {
        live = true;
      }
    })
    alerts = alerts.filter(function(a) {
      return a.BannerTypeId != 1 //remove the school closings banner
    })
    alerts.map((a, i) => {
      a.activeOrder = i;
    })
    this.setState({
      alerts: alerts,
      active: alerts.length > 0
        ? true
        : false,
      schoolsClosed: schoolsClosed,
      schoolClosingUrl: schoolClosingUrl,
      live: live
    })
  }

  slideBanner() {
    if (!this.state.collapsed)
      return null
    this.setState(function(prevState) {
      if (prevState.alerts.length == 0)
        return
      let newalerts = prevState.alerts.map((el, i, array) => {
        el.activeOrder = el.activeOrder != 0
          ? el.activeOrder - 1
          : array.length - 1;
        return el
      })
      return {alerts: newalerts}
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.active != prevState.active || this.state.collapsed != prevState.collapsed)
      this.makeSpaceForHeader();
    }

  componentWillUnmount() {
    clearInterval(this.bannerChecker);
    clearInterval(this.bannerSlider);
    this.makeSpaceForHeader();
  }

  makeSpaceForHeader = () => {
    /* css transition for this effect can be found both in Banner.css and global.css */
    var banner_height = this.state.active
      ? (this.state.collapsed
        ? 40
        : this.state.alerts.length * 40)
      : 0;

    var headerHeight = 101;
    if (typeof document.getElementById('gnm-header-without-banner') == 'object') {
      headerHeight = document.getElementById('gnm-header-without-banner').offsetHeight;
    }
    let new_padding = (headerHeight + banner_height + this.UtilityBeltHeight + 8) + 'px';
    /* really hate touching the DOM, but I don't see any way out of this */
    if (document.getElementById('gnm-main-body'))
      document.getElementById('gnm-main-body').style.paddingTop = new_padding;
    /* for frankly layout only */
    if (document.querySelector('.PageGrid.PageBody.container'))
      document.querySelector('.PageGrid.PageBody.container').style.paddingTop = new_padding;
    }

  toggleCollapsed() {
    this.setState((prevState) => {
      return {
        collapsed: !prevState.collapsed
      }
    })
  }

  animatedStyle = (a, i) => {
    if (this.state.collapsed) {
      if (this.state.alerts.length == 1) {
        return {};
      }
      let transformPercent = 0;
      let zIndex = '-1'
      if (a.activeOrder == this.state.alerts.length - 1) {
        transformPercent = 100;
        zIndex = '1';
      }
      if (a.activeOrder == 0) {
        zIndex = '1';
      }
      return {
        zIndex: (this.state.alerts.length - a.activeOrder).toString(),
        transition: 'z-index ' + 6 *this.transitionSpeed + 'ms linear,  transform ' + this.transitionSpeed + 'ms ease-in-out',
        transform: 'translate3d(0,' + transformPercent + '%,0)'
      }
    } else {
      return {
        opacity: '1',
        zIndex: (this.state.alerts.length - a.activeOrder).toString(),
        transition: 'z-index 0ms, transform ' + this.transitionSpeed + 'ms ease-in-out',
        transform: 'translate3d(0,' + 100 *a.activeOrder + '%,0)'
      }
    }
  }

  animatedClass = (a, i) => {
    if (this.state.collapsed == true)
      return 'alert-red';

    if (a.activeOrder % 2 == 1)
      return 'alert-dark-red';
    return 'alert-red';
  }

  wrapperStyle() {
    if (this.state.collapsed) {
      if (this.state.active > 0)
        return {
          height: 40 + this.UtilityBeltHeight + 'px'
        }
      else
        return {
          height: this.UtilityBeltHeight + 'px'
        }
      } else
      return {
        height: this.state.alerts.length*40 + this.UtilityBeltHeight + 'px'
      }
  }

  render() {
    return (
      <div className={'gnm-banner '}>
        <div className='gnm-banner-control' style={this.wrapperStyle()}>
          <div className='container '>
            <button className='show-all' onClick={this.toggleCollapsed.bind(this)} style={{
              display: this.state.alerts.length > 1
                ? 'block'
                : 'none'
            }}>
              <span className={'glyphicon glyphicon-chevron-up' + (this.state.collapsed
                ? ' collapsed'
                : '')} />
            </button>
            <div className='alert-container'>

              {this.state.alerts.map((a, i) => {
                return (
                  <div key={i} className={'item '} style={this.animatedStyle(a, i)} role='option'>
                    <div className={'alert ' + this.animatedClass(a, i) + (a.activeOrder == 0
                      ? ' active'
                      : '')} role='alert'>
                      <div className='line-clamp '>
                        <a href={a.Link}>
                          <span className=''>{a.Title}:
                          </span>
                          <span>{' ' + a.Description}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })
            }
            </div>
          </div>
        </div>
        <UtilityBelt affliate='kotv' schoolsClosed={this.state.schoolsClosed} schoolClosingUrl={this.state.schoolClosingUrl} live={this.state.live} style={{
          height: this.UtilityBeltHeight + 'px'
        }} />
      </div>

    )
  }
}


class MobileMegaNav extends Component {
  constructor(props) {
    super(props)
    this.state = {
      open: props.open
        ? true
        : false,
      items: []
    }

    this.toggleParent = props.toggle;
    this.subNavOpenInhibitor = false;
    this.subNavOpenTimer = null;
  }

  componentWillReceiveProps(nextProps) {
    /* it will not likely mount with the menu already */
    nextProps.items.forEach(i => {
      i.active = false;
    })
    this.setState({items: nextProps.items, open: nextProps.open})  }

  toggleSubMenu(i) {
    /* don't forget to close the others */
    this.setState((prevState) => {
      if (prevState.items[i].active) {
        prevState.items.map(item => {
          item.active = false
        })
      } else {
        prevState.items.map(item => {
          item.active = false
        });
        prevState.items[i].active = true;
      }
      return {items: prevState.items}
    })
  }

  toggleMenu = () => {
    this.toggleParent();
    this.setState(function(prevState) {
      return {
        open: !prevState.open
      }
    })
  }

  allClicks(e) {
    if (e.target.classList[0] == 'out-of-menu')
      this.toggleMenu();
    console.log(e.target.classList[0]);
  }

  render() {
    return (
      <div className={' gnm-mobile-mega-nav ' + (this.state.open
        ? 'active'
        : '')} onClick={this.allClicks.bind(this)}>
        <div className='container'>
          <div className='out-of-menu row '>
            <div className='col-lg-3 col-md-4 col-sm-3 col-xs-6 dark-background first-column'>
              <div className='row lift'>
                <div className='col-xs-12 search-container'>
                  <div className='input-group'>
                    <input type='text' className='form-control' placeholder='Search' />
                    <span className='input-group-btn' >
                      <button className='btn btn-default' type='button'>
                        <span className='glyphicon glyphicon-search' />
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              {this.state.items.map((navitem, i) => {
                return (
                  <div key={i} onClick={this.toggleSubMenu.bind(this, i)}>
                    <div className=' row lift'>
                      <div className={' exclusive-hover category col-xs-12 hover-color ' + (navitem.active
                        ? 'active'
                        : '')}>
                        <div className='row'>
                          <div className='col-xs-9 pointer'>
                            <span >{navitem.title}</span>
                          </div>
                          <div className='col-xs-3 pointer'>
                            <span className={' glyphicon glyphicon-chevron-right ' + (navitem.active
                              ? 'spun'
                              : '')} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {this.state.items.map((navitem, i) => {
                return (
                  <div key={i} className={' dark-background subcategory-page ' + (navitem.active
                    ? 'active '
                    : 'inactive')}>

                    <div className={'col-xs-12 inner-border'}>
                      <div className='row hover-color  category subcategory top-level-route'>
                        <a href='#'>
                          <div className='col-xs-12 tiny-padding-top '>
                            <span>{navitem.title + ' Home'}</span>
                          </div>
                        </a>
                      </div>
                      {navitem.subItems.map((subitem, j) => {
                        return (
                          <div key={j} className='row hover-color  category subcategory'>
                            <a href='#' onClick={this.toggleMenu}>
                              <div className='col-xs-12 tiny-padding-top'>
                                <span href='#'>{subitem.title}</span>
                              </div>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              })}
              <div className='subcategory-page dark-background ' />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

/* escape frankly deploy script with this text */

class CurrentConditions extends Component {
  constructor(props) { //gives us acces to props, fires long before page load
    super(props) //assigns props to this.props
    this.affiliate = props.affiliate;
    this.lastChecked = Date.now();
    this.state = {
      radarImg: `http://aws.kotv.com/MorHtml5/kotv/ssite/110x62_new/main_anim.gif?${ (new Date()).getTime()}`,
      city: '',
      state: '',
      conditionIcon: '',
      temp: '',
      feelsLike: '',
      high: '',
      low: '',
      currentConditions: []
    }
    this.gnmCurrentConditionsCache = null;
  }

  buildWeather = (data) => {
    if (!data)
      return
    let parseString = XML2JS.parseString,
      forecasts = [],
      jsondata,
      parsefunc = parseString(data, {
        attrNameProcessors: [(name => '@' + name)],
        explicitArray: false,
        charkey: '#text',
        mergeAttrs: true
      }, function(err, result) {
        jsondata = result;
      }),
      maindata = jsondata['WxSources'],
      forecastdata = maindata['forecast']['WxForecasts'],
      todaysforecast = forecastdata['WxForecast'][0],
      currentdata = maindata['conditions']['sfc_ob'];
    this.setState({
      city: currentdata['location']['#text'],
      state: currentdata['location']['@region'],
      conditionIcon: 'http://ftpcontent.worldnow.com/griffin/gnm/testing/svg/day/' + currentdata['WxIconType']['#text'] + '.svg',
      temp: currentdata['temp']['#text'],
      feelsLike: currentdata['apparent_temp']['#text'],
      high: todaysforecast['High'],
      low: todaysforecast['Low']
    });
  }

  componentDidMount() {
    if (!this.gnmCurrentConditionsCache)
      this.getCurrentConditions()
  }

  componentWillMount() {
    if (typeof window != 'object') {
      if (process.env.HOME == '/Users/don') {
        var CurrentConditionsCache = require('../ServerCache/CurrentConditionsCache.js')
        this.buildWeather(CurrentConditionsCache.get())
      }
    } else {
      if (typeof window.gnmCurrentConditionsCache != 'undefined') {
        this.gnmCurrentConditionsCache = window.gnmCurrentConditionsCache;
        this.buildWeather(window.gnmCurrentConditionsCache)
      }
    }
  }

  getCurrentConditions() {
    var zip = this.affiliate == 'kotv'
      ? 74120
      : 73179;
    var stationID = this.affiliate == 'kotv'
      ? 1
      : 2;
    var url = `http://kotv.com/api/GetForecast.ashx?target=data&action=WxForecast2012&site=` + stationID + `&zip=` + zip;
    Ajax(url).then((res) => {
      this.buildWeather(res);
      this.lastChecked = Date.now();
    })
  }

  render() { //REQUIRED
    return (
      <div className='gnm-current-conditions '>
        <div className='link-container hidden-xs hidden-sm'>
          <a href='#' className={'pull-right hidden-xs hidden-sm hidden-md map-link' + (this.state.temp
            ? ''
            : ' hidden')/* on one occassion, this value was unset */}>Tulsa, OK
            <span className='glyphicon glyphicon-map-marker' />
          </a>

        </div>
        <div className='pull-left'>
          <img className='pull-left weather-icon-sm' src={this.state.conditionIcon} />
          <span className={'pull-left current-temp temperature' + (this.state.temp
            ? ''
            : ' hidden')/* on one occassion, this value was unset */}>{this.state.temp}&deg;</span>
          <div>
            <span className='pull-right feels-like'>
              Feels like {this.state.feelsLike}&deg;</span>
          </div>
        </div>

        <a href='#' className='hidden-xs hidden-sm hidden-md'>
          <img className='pull-right radar-img ' src={this.state.radarImg} alt='radar image' />
        </a>

      </div>
    )
  }
}

var TempNav = [{
    'title': 'Home',
    'url': '/'
  },
  {
    'title': 'News',
    'url': '/category/112042/news',
    'subItems': [{
        'title': '6 Investigates',
        'url': '/category/175087/6-investigates'
      },
      {
        'title': 'Crime',
        'url': '/category/161867/crime'
      },
      {
        'title': 'Strange News',
        'url': '/category/13544/strange-news'
      },
      {
        'title': 'Health',
        'url': '/category/38921/health'
      },
      {
        'title': 'Politics',
        'url': '/category/312367/politics'
      },
      {
        'title': 'Special Coverage',
        'url': '/category/120892/special-coverage'
      },
      {
        'title': 'Oklahoma Earthquakes',
        'url': '/category/225338/oklahoma-earthquakes'
      },
      {
        'title': 'Links Mentioned',
        'url': '/category/120897/the-news-on-6-featured-links'
      },
      {
        'title': 'Send Us News Tips',
        'url': '/category/121090/the-news-on-6-news-tips'
      }
    ]
  },
  {
    'title': 'Weather',
    'url': '/weather',
    'subItems': [{
        'title': 'WARN Interactive Radar',
        'url': '/category/158741/warn-interactive-live-radar'
      },
      {
        'title': 'U Control: Street Level',
        'url': '/category/121189/weather-radar'
      },
      {
        'title': 'Watches & Warnings',
        'url': '/category/198135/u-control-weather-center'
      },
      {
        'title': 'Osage SKYCAMS',
        'url': '/category/197844/skycam-network'
      },
      {
        'title': 'Weather Safety',
        'url': '/category/120962/weather-safety'
      },
      {
        'title': 'Alan\'s Bus Stop Forecast',
        'url': '/category/167399/alans-bus-stop-forecast'
      },
      {
        'title': 'Fishing with Lacey',
        'url': '/category/320811/fishing-with-lacey'
      },
      {
        'title': 'Lake Levels',
        'url': '/story/7724324/oklahoma-lake-levels'
      },
      {
        'title': 'Traffic',
        'url': '/category/296298/news-on-6-traffic-map'
      }
    ]
  },
  {
    'title': 'Sports',
    'url': '/sports',
    'subItems': [{
        'title': 'OU',
        'url': '/category/210006/oklahoma-sooners'
      },
      {
        'title': 'OSU',
        'url': '/category/210005/oklahoma-state-cowboys'
      },
      {
        'title': 'TU',
        'url': '/category/210002/tulsa-golden-hurricane'
      },
      {
        'title': 'ORU',
        'url': '/category/210003/oral-roberts-golden-eagles'
      },
      {
        'title': 'Thunder',
        'url': '/category/210007/oklahoma-city-thunder'
      },
      {
        'title': 'Ford Sports Blitz',
        'url': '/category/219810/oklahoma-ford-sports-blitz'
      },
      {
        'title': 'High School Football',
        'url': '/category/211942/high-school-football'
      },
      {
        'title': 'Scores & Schedules',
        'url': '/category/216373/high-school-football-schedule-scoreboard'
      }
    ]
  },
  {
    'title': 'Video',
    'url': '/category/121535/video-page',
    'subItems': [{
        'title': 'Watch CBS Shows',
        'url': '/link/554772/cbs-programming-catch-your-favorite-cbs-shows-old-favorites'
      },
      {
        'title': 'Video Requests',
        'url': '/category/121092/the-news-on-6-video-requests'
      }
    ]
  },
  {
    'title': 'Recipes',
    'url': '/category/116530/recipes'
  },
  {
    'title': 'Lifestyle',
    'url': '/category/68446/lifestyle',
    'subItems': [{
        'title': 'Entertainment',
        'url': '/category/73801/entertainment'
      },
      {
        'title': 'Money',
        'url': '/category/120652/money'
      },
      {
        'title': 'Home & Family',
        'url': '/category/120651/home-family'
      },
      {
        'title': 'Health',
        'url': '/category/38921/health'
      },
      {
        'title': 'Food',
        'url': '/category/39546/food'
      },
      {
        'title': 'Pets',
        'url': '/category/29878/pets'
      },
      {
        'title': 'Technology',
        'url': '/category/58532/technology'
      },
      {
        'title': 'Travel',
        'url': '/category/23748/travel'
      },
      {
        'title': 'Beauty & Style',
        'url': '/category/76708/beauty-style'
      },
      {
        'title': 'Auto',
        'url': '/category/41934/auto'
      },
      {
        'title': 'VideoBytes',
        'url': '/category/120657/videobytes'
      },
      {
        'title': 'Press Releases',
        'url': '/category/230909/press-releases'
      }
    ]
  },
  {
    'title': 'Community',
    'url': '/category/197945/community',
    'subItems': [{
        'title': 'Weather Teller',
        'url': '/story/35036323/news-on-6-goes-old-school-with-nostalgic-weather-teller'
      },
      {
        'title': 'Food For Kids',
        'url': '/category/208729/food-for-kids'
      },
      {
        'title': 'TV Schedule',
        'url': '/story/11777977/tv-programming-schedule'
      },
      {
        'title': 'AARP Caregivers',
        'url': '/category/300552/aarp-care-act'
      },
      {
        'title': 'NOW Cable Listings',
        'url': '/category/277097/kotv-channels'
      }
    ]
  },
  {
    'title': 'Contests',
    'url': '/category/122577/contests',
    'subItems': [{
        'title': 'Text & Win',
        'url': '/link/462221/text-win'
      },
      {
        'title': 'Winners\' Circle',
        'url': '/story/18813691/winners-circle'
      }
    ]
  },
  {
    'title': 'About Us',
    'url': '/category/156589/about-us',
    'subItems': [{
        'title': 'Contact Us',
        'url': '/category/156589/about-us'
      },
      {
        'title': 'Products',
        'url': '/category/191276/tools-and-features'
      },
      {
        'title': 'Careers',
        'url': '/category/120924/employment-opportunities'
      }
    ]
  }
]


class Header extends Component {
  constructor(props) {
    super(props);
    this.stationID = props.affiliate === 'kwtv'
      ? 2
      : 1; //Dont beleive this has been set yet
    this.affiliate = props.affiliate;
    this.stackedLogoUrl = props.affiliate == 'kotv'
      ? 'img/n6-stacked-logo.svg'
      : 'img/n9-stacked-logo.svg';
    this.otsLogoUrl = props.affiliate == 'kotv'
      ? 'img/n6logo.svg'
      : 'img/n6logo.svg';
    this.navigation_data = props.cache;
    this.state = {
      largeLogoUrl: 'http://ftpcontent.worldnow.com/kotv/test/don/build/img/bug.svg',
      smallLogoUrl: 'http://ftpcontent.worldnow.com/kotv/test/don/build/img/n6logo.svg',
      radarImg: `http://aws.kotv.com/MorHtml5/kotv/ssite/110x62_new/main_anim.gif?${ (new Date()).getTime()}`,
      navItems: [],
      megaNavItems: [],
      mobileMegaNavItems: [],
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

  componentDidMount() {
    if (typeof window == 'object') {
      this.buildState(TempNav)
    }
  }

  componentWillMount() {
    if (typeof window != 'object')
      if (process.env.HOME == '/Users/don') {
        /* problem here we can't run this on Frankly servers */
        var NavigationCache = require('../ServerCache/NavigationCache.js')
        this.buildState(NavigationCache.get()); //sorry
      }
    }

  buildState(navs) {
    let navItems = [];
    let megaNavItems = [];
    let mobileMegaNavItems = [];
    navs.map(function(item, i) {
      if (typeof item.subItems !== 'undefined' && item.title !== 'About Us' && item.title !== 'Video' && item.title != 'Contests' && item.title !== 'Home') {
        megaNavItems.push(item);
      }
      if (typeof item.subItems !== 'undefined' && item.title !== 'Home')
        mobileMegaNavItems.push(item);

      if (item.title !== 'About Us' && item.title !== 'Home') {
        navItems.push(item);
      }
    });
    this.setState({navItems: navItems, megaNavItems: megaNavItems, mobileMegaNavItems: mobileMegaNavItems});
  }

  toggleMobileMegaNav = () => {
    this.setState({
      mobileMegaNavOpen: !this.state.mobileMegaNavOpen
    })
  }

  render() {
    return (
      <div className='gnm-header'>
        <Banner affiliate={this.affiliate} />
        <div id='gnm-header-without-banner'>
          <div className='container'>
            <div className='pull-left'>
              <button onClick={this.toggleMobileMegaNav} className={'dark-icon-bar-container ' + (this.state.mobileMegaNavOpen
                ? 'active'
                : '')}>
                <div className='dark-icon-bar' />
                <div className='dark-icon-bar' />
                <div className='dark-icon-bar' />
              </button>
            </div>
            <div className='pull-left visible-lg-block visible-md-block'>
              <img src={this.stackedLogoUrl} className='logo-stacked' />
            </div>
            <div className='pull-left visible-xs-block visible-sm-block'>
              <img src={this.otsLogoUrl} className='logo-ots' />
            </div>
            <div className='pull-left visible-lg-block'>
              <img className='ad768' src='img/ad728x90.jpg' />
            </div>
            <div className='pull-left visible-md-block'>
              <img className='ad640' src='img/ad-md-640x100.jpg' />
            </div>
            <div className='pull-left visible-sm-block'>
              <img className='ad320' src='img/ad-md-640x100.jpg' />
            </div>
            <div className='pull-right'>
              <CurrentConditions affiliate={this.affiliate} />
            </div>
          </div>
        </div>
        <MobileMegaNav items={this.state.mobileMegaNavItems} open={this.state.mobileMegaNavOpen} toggle={this.toggleMobileMegaNav} />
      </div>
    );
  }
}

export default Header;
