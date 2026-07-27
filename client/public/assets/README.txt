Place your 4 card image assets here, using exactly these filenames:

  citizen.jpg
  emperor.jpg
  slave.jpg
  back.jpg

Recommended aspect ratio: portrait (e.g. 2:3 or 3:4) to match standard
playing-card proportions, since the Card component renders at fixed
w:h ratios (e.g. 112x160px at "lg" size). JPGs in the 200-500px range
on the long edge are plenty — these are preloaded on app start via
components/ui/AssetPreloader.tsx, so keep file sizes reasonable
(under ~150KB each) to keep that preload snappy on mobile networks.
