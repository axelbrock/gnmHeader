
const Schedule = (function(){
  const m = 60*60*1000; //miliseconds per hour
  var begin = new Date()
  var dayofweek = begin.getDay() //SUnday is zero
  var kotv, kwtv;
  begin.setHours(0);
  begin.setMinutes(0)
  begin.setSeconds(0)
  begin.setMilliseconds(0)
  begin.setHours(-24*dayofweek)
  begin = begin.getTime();
  /* this will need to be address before next football season */
  const fb ={
    start: new Date(2017,9,7),
    end: new Date(2018, 2, 8)
  }

  function generate(sun, mf, sat){
    var schedule = sun;
    for (var i = 1; i < 6; i++) {
      let day = mf.map(t=>t + i*24)
      schedule = schedule.concat(day)
    }
    var day = sat.map(t=>t + 6*24)
    schedule = schedule.concat(day)
    schedule = schedule.map(h=>{
      return new Date(begin + h*m )
    })
    return schedule;
  }



  function football(){
    var now = new Date()
    if( now.getTime() < fb.end.getTime() && fb.start < now.getTime())
      return true
    return false
  }

  /*
  Sunday
  6 a.m.
  5:30 p.m. – when we’re not in football season
  9 p.m.
  10 p.m.

  Monday – Friday
  4:30 a.m.
  12 p.m.
  5 p.m.
  6 p.m.
  9 p.m.
  10 p.m.

  Saturday
  8 a.m.
  6 p.m.
  9 p.m.
  10 p.m.
  */
  if(football() == false)
    kotv = generate([6, 17.5, 21, 22],[4.5,12,17,18,21,22],[8,18,21,22])
  else
    kotv = generate([6, 21, 22],[4.5,12,17,18,21,22],[8,18,21,22])
  /*
  Sunday
  5 a.m.
  5:30 p.m. – when not in football season
  10 p.m.

  Monday - Friday
  4 a.m.
  12 p.m.
  4 p.m.
  5 p.m.
  6 p.m.
  10 p.m.

  Saturday
  5 a.m.
  6 p.m.
  10 p.m.
  */

  if(football() == false)
    kwtv = generate([5,17.5, 22],[4,12,16,17,18,22],[5,18,22])
  else
    kwtv = generate([5, 22],[4,12,16,17,18,22],[5,18,22])
    // console.log('kotv',kotv)
    // console.log('kwtv',kwtv)
  return { kotv: kotv , kwtv: kwtv }
})()





export {
  Schedule
}
