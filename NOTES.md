Architecture

```
                                +-------------+
        +---- makes use of ---> | libraries   |--+
        |          (1)          +-------------+  |
   +---------+                     +-------------+
   | Service |--+                        +------------------+                       +------------------------------+
   +---------+  |  -- registers with --> | asapi-controller | -- registers with --> | web framework (e.g. Express) |
     +----------+           (2)          +------------------+         (3)           +------------------------------+
                           
  (1) - Using matrix-js-sdk, database helper, etc
  (2) - addQueryHandler, register syntax
  (3) - Specific to web framework being used, multiple ports (1/service potentially)  
```