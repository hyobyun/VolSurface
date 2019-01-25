# VolSurface
![An ugly volatility surface](/screenshot.png?raw=true "Screenshot of volatility surface")
I'm too poor to be able to afford Bloomberg Terminal, and I wanted a decent way to visualize implied volatility across different dates and strikes. This is a Volatility Surface Visualization you can run in a modern browser. You must input data from the CBOE quote export tools.

This is still a work in progress, but pretty usable

## Features
- 3D display of volatility surfaces for puts and calls
- Click on surface to view interpolated strike, expiration,Implied Vol
- Navigate around surfaces
- Axis labels

## interpolation
Currently, the interpolation used is a minimal null fill that occurs from the center strike out to all sets of strikes seen in all contracts. The interpolation or parameterization methods could use a lot of improvement, however, the current strategy used mostly understandable surfaces with minimal distortion from missing pricing data.

## Upcoming:
- Better Parameterization /Interpolation
- Surface 2D Slice Visualization



## Install Instructions
`npm Install`

## Usage Instructions
To Get Data, goto <http://www.cboe.com/delayedquote/quote-table-download> and download a .dat file.
Click "Add File" and upload the file in the prompt.
