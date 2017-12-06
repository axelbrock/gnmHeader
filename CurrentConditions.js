import React, {Component, PropTypes} from 'react';
/* escape frankly deploy script with this text */
import XML2JS from 'xml2js';
import Ajax from './Ajax';

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
      //  var CurrentConditionsCache = require('../ServerCache/CurrentConditionsCache.js')
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

  render() {
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

export default CurrentConditions;
