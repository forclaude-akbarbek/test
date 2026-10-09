// Standard SAT vocabulary lists (placeholder content written for the demo).
// Format per line: word | part of speech | definition | example sentence

export interface Word {
  word: string
  pos: string
  def: string
  example: string
  list: string
}

const RAW: Record<string, string> = {
  'Academic Essentials': `
analyze|verb|to examine something carefully in order to understand it|The team analyzed the survey results before drawing any conclusions.
assert|verb|to state something confidently as true|The author asserts that cities must plan for rising temperatures.
coherent|adjective|logical and consistent; easy to follow|Her argument was coherent, with each point building on the last.
comprehensive|adjective|including all or nearly all elements|The report offers a comprehensive review of the region's water supply.
concede|verb|to admit that something is true, often reluctantly|The senator conceded that the plan would cost more than expected.
contend|verb|to argue or claim|Some historians contend that the treaty was signed under pressure.
corroborate|verb|to confirm or give support to a claim|New fossils corroborate the theory that birds descended from dinosaurs.
derive|verb|to obtain something from a source|Many English words derive from Latin.
discern|verb|to perceive or recognize something not obvious|It was difficult to discern the speaker's real intention.
empirical|adjective|based on observation or experiment|The claim lacks empirical support.
hypothesis|noun|a proposed explanation that can be tested|The experiment was designed to test her hypothesis.
implicit|adjective|suggested but not directly stated|The poem contains an implicit criticism of city life.
infer|verb|to conclude from evidence and reasoning|From the muddy boots, we inferred that he had been in the garden.
nuanced|adjective|showing subtle differences or distinctions|The novel offers a nuanced portrait of family life.
plausible|adjective|seeming reasonable or probable|The detective found the suspect's story plausible.
premise|noun|a statement on which an argument is based|The essay rests on the premise that education reduces inequality.
qualify|verb|to limit or modify a statement|The researcher qualified her claim by noting the small sample size.
substantiate|verb|to provide evidence to support a claim|He could not substantiate his accusations.
synthesize|verb|to combine ideas into a coherent whole|The paper synthesizes findings from twenty studies.
underscore|verb|to emphasize|The data underscore the need for early intervention.
validate|verb|to confirm that something is correct or acceptable|Further trials are needed to validate the results.
`,
  'Tone & Attitude': `
ambivalent|adjective|having mixed feelings|She felt ambivalent about leaving her hometown.
apprehensive|adjective|anxious or fearful about the future|The students were apprehensive before the exam.
candid|adjective|truthful and straightforward|He gave a candid account of his mistakes.
cynical|adjective|believing people are motivated by self-interest|Years in politics had made him cynical.
disdain|noun|a feeling that someone or something is unworthy|She looked at the cheap souvenir with disdain.
earnest|adjective|showing sincere and serious intention|He made an earnest effort to improve.
indifferent|adjective|having no interest or concern|The cat seemed indifferent to the new toy.
ironic|adjective|meaning the opposite of what is said|"Lovely weather," she said, ironic, as the rain poured.
jubilant|adjective|feeling or expressing great joy|The jubilant crowd celebrated the victory.
nostalgic|adjective|longing for the past|Old photographs made him nostalgic for his childhood.
pragmatic|adjective|dealing with things practically|The mayor took a pragmatic approach to the budget.
reverent|adjective|showing deep respect|Visitors spoke in reverent tones inside the ancient mosque.
sardonic|adjective|grimly mocking or cynical|He gave a sardonic smile when his plan failed.
skeptical|adjective|not easily convinced; having doubts|Scientists were skeptical of the dramatic claim.
somber|adjective|dark or gloomy; serious|The mood at the ceremony was somber.
whimsical|adjective|playfully quaint or fanciful|The illustrations had a whimsical charm.
wistful|adjective|having a feeling of vague, regretful longing|She cast a wistful glance at the closing shop.
zealous|adjective|having great energy or enthusiasm for a cause|The zealous volunteers worked through the night.
`,
  'Change & Degree': `
abate|verb|to become less intense|The storm finally abated by morning.
accelerate|verb|to increase in speed or rate|Warming oceans may accelerate ice loss.
augment|verb|to make greater by adding to|She augmented her income by tutoring.
curtail|verb|to reduce or restrict|The city curtailed water use during the drought.
diminish|verb|to make or become smaller|The noise diminished as the crowd left.
dwindle|verb|to gradually decrease|Their savings dwindled over the long winter.
escalate|verb|to increase rapidly|The argument escalated into a shouting match.
exacerbate|verb|to make a problem worse|Skipping sleep can exacerbate stress.
fluctuate|verb|to rise and fall irregularly|Prices fluctuate with the seasons.
mitigate|verb|to make less severe|Trees mitigate the effects of urban heat.
negligible|adjective|so small as to be not worth considering|The difference in cost was negligible.
proliferate|verb|to increase rapidly in number|Cafés have proliferated across the city.
surge|noun|a sudden powerful increase|There was a surge in applications after the announcement.
wane|verb|to decrease in strength or importance|Interest in the trend began to wane.
`,
  'Agreement & Conflict': `
adversary|noun|an opponent|The two chess players were longtime adversaries.
alleviate|verb|to make suffering less severe|The medicine alleviated her headache.
amicable|adjective|friendly and without disagreement|The partners reached an amicable agreement.
antagonize|verb|to cause someone to become hostile|His remarks antagonized the audience.
compromise|noun|an agreement where each side gives up something|After hours of debate, they reached a compromise.
concur|verb|to agree|The judges concurred with the decision.
contentious|adjective|causing disagreement|The new law was highly contentious.
dissent|noun|disagreement with an official opinion|There was little dissent within the committee.
reconcile|verb|to restore friendly relations; to make compatible|It is hard to reconcile his words with his actions.
refute|verb|to prove a statement wrong|The scientist refuted the claim with new data.
rift|noun|a serious break in a relationship|The dispute caused a rift between the brothers.
undermine|verb|to weaken gradually|Rumors undermined trust in the leadership.
unanimous|adjective|fully in agreement|The vote was unanimous.
`,
  'Science & Data': `
anomaly|noun|something that deviates from what is expected|The spike in the data was an anomaly.
catalyst|noun|something that causes change or speeds up a process|The discovery was a catalyst for new research.
correlation|noun|a relationship between two things|There is a strong correlation between sleep and memory.
dormant|adjective|temporarily inactive|The volcano has been dormant for centuries.
emit|verb|to give off|The device emits a faint blue light.
inherent|adjective|existing as a natural, permanent quality|There are risks inherent in any experiment.
intrinsic|adjective|belonging naturally; essential|Curiosity is intrinsic to scientific work.
replicate|verb|to repeat an experiment to obtain the same results|Other labs could not replicate the findings.
resilient|adjective|able to recover quickly|Some coral species are surprisingly resilient.
symbiotic|adjective|involving a mutually beneficial relationship|Bees and flowers have a symbiotic relationship.
synthetic|adjective|made by chemical processes; artificial|The fabric is made from synthetic fibers.
viable|adjective|capable of working successfully|Solar power is a viable alternative to coal.
volatile|adjective|liable to change rapidly and unpredictably|The market remained volatile all year.
`,
  'Character & Behavior': `
altruistic|adjective|showing selfless concern for others|Her altruistic work helped hundreds of families.
arrogant|adjective|having an exaggerated sense of one's importance|His arrogant tone annoyed his colleagues.
benevolent|adjective|well-meaning and kindly|The benevolent donor funded a new library.
diligent|adjective|showing care and effort in work|Diligent students review their mistakes.
frugal|adjective|careful with money or resources|The frugal family saved for years.
gregarious|adjective|fond of company; sociable|Gregarious by nature, he loved parties.
impetuous|adjective|acting quickly without thought|The impetuous decision cost them dearly.
meticulous|adjective|showing great attention to detail|She kept meticulous records of every experiment.
obstinate|adjective|stubbornly refusing to change|The obstinate child refused to eat vegetables.
prudent|adjective|acting with care for the future|It is prudent to save part of your income.
resolute|adjective|firmly determined|She remained resolute in the face of criticism.
tenacious|adjective|persistent; not giving up easily|The tenacious reporter followed the story for years.
timid|adjective|showing a lack of courage or confidence|The timid kitten hid under the bed.
`,
  'History & Society': `
advocate|verb|to publicly support|She advocates for better public transport.
autonomy|noun|self-government; independence|The region was granted greater autonomy.
bureaucracy|noun|a system of government with many rules and officials|Bureaucracy slowed the approval process.
egalitarian|adjective|believing all people deserve equal rights|The movement promoted egalitarian ideals.
hierarchy|noun|a system in which people are ranked by status|The company had a rigid hierarchy.
ideology|noun|a system of ideas forming the basis of a theory or policy|The party's ideology shaped its policies.
legacy|noun|something handed down from the past|The scholar's legacy includes dozens of students.
precedent|noun|an earlier event used as an example|The ruling set an important precedent.
reform|noun|a change made to improve something|The education reform added new subjects.
sovereign|adjective|possessing supreme power; independent|Uzbekistan became a sovereign state in 1991.
`,
  'Literary Language': `
allude|verb|to refer to something indirectly|The title alludes to an ancient myth.
ambiguous|adjective|open to more than one interpretation|The ending of the story is deliberately ambiguous.
anecdote|noun|a short personal story|The speaker opened with a funny anecdote.
convey|verb|to communicate an idea or feeling|The painting conveys a sense of calm.
depict|verb|to show or represent|The mural depicts life on the Silk Road.
elicit|verb|to draw out a response|The question elicited a thoughtful answer.
evoke|verb|to bring a feeling or memory to mind|The smell of bread evoked memories of home.
juxtapose|verb|to place side by side for contrast|The film juxtaposes city life with village life.
satirize|verb|to use humor to criticize|The play satirizes the habits of the wealthy.
succinct|adjective|briefly and clearly expressed|Give a succinct summary of the article.
`,
}

export const WORD_LISTS = Object.keys(RAW)

export const WORDS: Word[] = Object.entries(RAW).flatMap(([list, block]) =>
  block
    .trim()
    .split('\n')
    .map((line) => {
      const [word, pos, def, example] = line.split('|')
      return { word, pos, def, example, list }
    }),
)

export const wordByName = (w: string) => WORDS.find((x) => x.word === w)
