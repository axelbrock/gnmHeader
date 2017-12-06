import React, { Component } from 'react';
import {Schedule} from './UtilityBeltSchedule';

class UtilityBelt extends Component {
  constructor(props){
    super(props);
    this.liveUrl = 'http://www.newson6.com/live';
    this.affliate = this.props.affliate;
    if(this.props.affliate == 'kotv')
      this.schedule = Schedule.kotv;
    else
      this.schedule = Schedule.kwtv;
  }

  makeReadable(d){
    let text = d.toLocaleTimeString().split(' ');
    let letters = text[0].split('');
    letters.splice(-3);
    return  letters.join('') + ' ' + text[1];
  }

  nextLive(){
    var now = new Date();
    var nextLiveDate = this.schedule[0];
    for (var i = 1; i < this.schedule.length; i++) {
      if(this.schedule[i].getTime() > now.getTime()){
        nextLiveDate = this.schedule[i];
        break;
      }
    }

    return this.makeReadable(nextLiveDate)
  }

  render(){ 
    return (<div className={'gnm-utility-belt ' +(this.props.schoolsClosed? 'schools-closed' : '')}>
      <div className='container'>
        <span className='next-live pull-left' style={{display: !this.props.live && !this.props.schoolsClosed? 'block': 'none'}}>
          <span className='fa fa-clock-o' />
          <a  href={this.liveUrl}>NEXT LIVE BROADCAST AT {this.nextLive()}</a>
        </span>
        <span className='next-live pull-left' style={{display: this.props.live? 'block': 'none'}}>
          <span className='animated-television' />
          <a  href={this.liveUrl} className='live-message'>
            <span style={{display: this.props.schoolsClosed? 'none' : ''}}>WATCH</span>
            <span> LIVE</span>
          </a>
        </span>
        <span className='closings pull-left'
          style={{display: this.props.schoolsClosed? 'block': 'none',
                  borderLeft: !this.props.live ? 'none' : '2px solid  #222222',
                  paddingLeft: !this.props.live ? '0px' : '10px'}}>

          <a href={this.props.schoolClosingUrl}>School Closings <i ><span className='unecessary'>Sponsored by Osage River Spirit Casino and Resort</span></i></a>
        </span>

        <span className='utilities pull-right'>
          <span className='fa fa-search' />
          <span className='fa fa-facebook-official' />
          <span className='fa fa-twitter' />
          <span className='fa fa-instagram' />
          <span className='fa fa-youtube' />
        </span>

      </div>
    </div>)
  }
}

export default UtilityBelt;
