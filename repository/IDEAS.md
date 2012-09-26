Assumptions
 * occured events do not change in general
 * only judges have power to change results
 * spectator may start following competition at any time
 * events occured within a class do not have ANY effect on other classes --> class independency

Possible approach
 * Competition progression is describes by progression-sets
 * Revisions (rev-1001.json) for continuous streaming
 * Bunch updates for new followers

Scalability in mind...
 * Most common events should be applied easily

Language support:
 * PHP
 * Python
 * Java

Emerging concepts:
 * progression-set
 * state-set
 * master-repository (plain text files?)
 * client-repository (HTML5 web-sql-db)

Competition model:
 * meet info
 * athlete
 * class (contains athletes)
 * result (athelte owns)
