"use client"

import { useState } from "react"

export default function WW2Timeline() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const events = [
    {
      year: "1939",
      date: "SEP 1",
      title: "Germany Invades Poland",
      description:
        "Nazi Germany's invasion of Poland marks the beginning of World War II in Europe. Britain and France declare war on Germany two days later.",
      image: "https://cdn.britannica.com/39/185239-050-ACC5D1A6/soldiers-German-vehicles-Poland-September-1939.jpg",
    },
    {
      year: "1941",
      date: "DEC 7",
      title: "Attack on Pearl Harbor",
      description:
        "Japanese forces launch a surprise military strike against the United States naval base at Pearl Harbor, Hawaii. Over 2,400 Americans killed, prompting U.S. entry into WWII.",
      image:
        "https://cdn.britannica.com/81/71381-050-0042470B/battleship-attack-Pearl-Harbor-Japanese-Hawaii-December-7-1941.jpg",
    },
    {
      year: "1942",
      date: "JUN 4",
      title: "Battle of Midway",
      description:
        "Decisive naval battle in the Pacific Theater where U.S. forces defeat the Imperial Japanese Navy. Four Japanese aircraft carriers sunk, marking the turning point of the Pacific War.",
      image:
        "https://www.history.navy.mil/content/history/nhhc/browse-by-topic/wars-conflicts-and-operations/world-war-ii/1942/midway/_jcr_content/body/media_asset_1214160830/image.img.jpg/1570137901156.jpg",
    },
    {
      year: "1943",
      date: "FEB 2",
      title: "Battle of Stalingrad Ends",
      description:
        "After five months of brutal urban warfare, Soviet forces defeat the German 6th Army. Over 2 million casualties total, marking Germany's first major defeat and turning point on the Eastern Front.",
      image: "https://static01.nyt.com/images/2012/01/30/learning/Feb02LN/Feb02LN-blog480.jpg",
    },
    {
      year: "1944",
      date: "JUN 6",
      title: "D-Day Normandy Invasion",
      description:
        "Operation Overlord begins as 156,000 Allied troops land on five beaches in Normandy, France. Largest amphibious invasion in history, opening the Western Front against Nazi Germany.",
      image:
        "https://npr.brightspotcdn.com/dims3/default/strip/false/crop/3729x2486+0+336/resize/3729x2486!/?url=http%3A%2F%2Fnpr-brightspot.s3.amazonaws.com%2F81%2F2e%2F16a9f2f24f77a05154dd52ac3d77%2Fgettyimages-3209092.jpg",
    },
    {
      year: "1945",
      date: "MAY 8",
      title: "Victory in Europe Day",
      description:
        "Nazi Germany signs unconditional surrender following Hitler's suicide and the fall of Berlin. Celebrations erupt across Europe and America as the war in Europe officially ends.",
      image:
        "https://i.guim.co.uk/img/media/0d584a698b4d25fcd2c2157c506f482fd1dd3079/0_495_5100_3061/master/5100.jpg?width=1200&height=900&quality=85&auto=format&fit=crop&s=8ed01d82781de66557abcad555d00c19",
    },
    {
      year: "1945",
      date: "AUG 15",
      title: "Victory over Japan Day",
      description:
        "Japan announces surrender following atomic bombings of Hiroshima and Nagasaki. Emperor Hirohito's radio broadcast ends World War II, with formal surrender signed September 2 aboard USS Missouri.",
      image: "https://common.usembassy.gov/wp-content/uploads/sites/97/2023/08/GettyImages-566464823-1024x749.jpg",
    },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-16 lg:p-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-20 md:mb-28">
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-zinc-50 mb-4 tracking-tight leading-none">
            World War II
          </h1>
          <p className="font-mono text-sm md:text-base text-amber-500/80 tracking-wider">1939 — 1945</p>
        </div>

        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-0 md:left-[100px] top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/20 via-amber-500/40 to-amber-500/20" />

          <div className="space-y-16 md:space-y-24">
            {events.map((event, index) => (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Timeline dot */}
                <div
                  className="absolute left-[-4px] md:left-[96px] top-0 w-2 h-2 rounded-full bg-amber-500 ring-4 ring-amber-500/20 transition-all duration-300"
                  style={{
                    transform: hoveredIndex === index ? "scale(1.5)" : "scale(1)",
                  }}
                />

                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 md:gap-12 pl-8 md:pl-0">
                  <div className="flex flex-col gap-1">
                    <div className="font-mono text-xs md:text-sm text-amber-500/60 tracking-widest">{event.date}</div>
                    <div className="font-mono text-2xl md:text-3xl text-amber-500 tracking-tight font-bold">
                      {event.year}
                    </div>
                  </div>

                  <div className="space-y-6 group">
                    <div className="space-y-3">
                      <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-zinc-50 leading-tight tracking-tight transition-colors duration-300 group-hover:text-amber-500/90">
                        {event.title}
                      </h2>
                      <p className="text-zinc-400 text-base md:text-lg leading-relaxed max-w-3xl">
                        {event.description}
                      </p>
                    </div>

                    <div className="relative overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800 transition-all duration-500 group-hover:border-amber-500/30 group-hover:shadow-2xl group-hover:shadow-amber-500/10">
                      <div className="aspect-[16/10] relative">
                        <img
                          src={event.image || "/placeholder.svg"}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Subtle gradient overlay for better text contrast if needed */}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-32 md:mt-40">
          {/* Final timeline dot */}
          <div className="absolute left-[-4px] md:left-[96px] top-0 w-2 h-2 rounded-full bg-zinc-600" />

          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 md:gap-12 pl-8 md:pl-0">
            <div className="flex flex-col gap-1">
              <div className="font-mono text-xs md:text-sm text-zinc-600 tracking-widest">1939-1945</div>
            </div>

            <div className="space-y-8 max-w-3xl">
              <div className="h-px bg-gradient-to-r from-zinc-800 to-transparent mb-12" />

              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-zinc-400 leading-tight tracking-tight">
                In Memoriam
              </h2>

              <p className="text-zinc-500 text-lg md:text-xl leading-relaxed font-light">
                World War II claimed the lives of an estimated 70-85 million people, approximately 3% of the world's
                population at the time. This includes military personnel and civilians from all nations involved.
              </p>

              <div className="grid grid-cols-2 gap-6 py-8">
                <div className="space-y-2">
                  <div className="font-mono text-3xl md:text-4xl text-zinc-600">~50-55M</div>
                  <div className="text-sm text-zinc-600 uppercase tracking-wider">Civilian Deaths</div>
                </div>
                <div className="space-y-2">
                  <div className="font-mono text-3xl md:text-4xl text-zinc-600">~25M</div>
                  <div className="text-sm text-zinc-600 uppercase tracking-wider">Military Deaths</div>
                </div>
              </div>

              <p className="text-zinc-600 text-base md:text-lg leading-relaxed italic border-l-2 border-zinc-800 pl-6">
                "We remember not only those who fought, but all who suffered—the innocent civilians, the persecuted, the
                displaced, and the countless families torn apart. Their sacrifice and suffering must never be forgotten,
                so that future generations may live in peace."
              </p>

              <div className="pt-8">
                <p className="font-mono text-xs text-zinc-700 tracking-wider">LEST WE FORGET</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
