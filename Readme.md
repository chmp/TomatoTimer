# Tomato Timer

This timer is a HTML5 utility to follow the [pomodoro technique](https://en.wikipedia.org/wiki/Pomodoro_Technique), a productivity technique.
It tries to facilitate getting into a flow state by dividing the work flow
into intervals of work and pauses with fixed durations.

This timer allows the user to be track the remaining time in each interval.
The timer uses notifications to alert the user of the end of the
current interval, clicking on the notification automatically starts the next
interval.
The timer automatically cycles between the intervals: work (25min), short 
break (5min), work, short break, work, short break, work, long break (15min).

This web app is offline enabled.

Give it a spin [here](http://chmp.github.io/TomatoTimer/).

## Change Log

- 2018-03-09: migrate to react, remove config + history
- 2017-01-16: add progress indicator as icon
- 2017-01-14: add option to configure intervals and their duration

## External libraries

This projects uses the following external libraries

- [reactjs](https://reactjs.org/)
- [faviconx](https://github.com/nicolasbize/faviconx)

FavIconX is packaged under `src/contrib/faviconx`

## License

    The MIT License (MIT)

    Copyright (c) 2014-2018 Christopher Prohm

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.

