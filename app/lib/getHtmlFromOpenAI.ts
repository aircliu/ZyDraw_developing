import { PreviewShape } from '../PreviewShape/PreviewShape'
import {
	OPENAI_USER_PROMPT,
	OPENAI_USER_PROMPT_WITH_PREVIOUS_DESIGN,
	OPEN_AI_SYSTEM_PROMPT,
} from '../prompt'


/**
 * This module exports a function `getHtmlFromOpenAI` that sends a request to the OpenAI API 
 * to generate HTML content based on provided parameters, including an image URL, text, grid details, 
 * and previous design previews. The function constructs a request payload, sends it to the OpenAI API,
 * and returns the API response.
 */


export async function getHtmlFromOpenAI({
    image,
    apiKey,
    text,
    grid,
    theme = 'light',
    previousPreviews = [],
}: {
    image: string
    apiKey: string
    text: string
    theme?: string
    grid?: {
        color: string
        size: number
        labels: boolean
    }
    previousPreviews?: PreviewShape[]
}) {
    if (!apiKey) throw Error('You need to provide an API key (sorry)')

    // Initialize the messages array for the OpenAI request
    const messages: GPT4VCompletionRequest['messages'] = [
        {
            role: 'system',
            content: OPEN_AI_SYSTEM_PROMPT,
        },
        {
            role: 'user',
            content: [],
        },
    ]

    const userContent = messages[1].content as Exclude<MessageContent, string>

    // Add the appropriate prompt based on whether there are previous previews
    userContent.push({
        type: 'text',
        text: previousPreviews?.length > 0 ? OPENAI_USER_PROMPT_WITH_PREVIOUS_DESIGN : OPENAI_USER_PROMPT,
    })

    // Add the image to the request
    userContent.push({
        type: 'image_url',
        image_url: {
            url: image,
            detail: 'high',
        },
    })

    // Add the text content if provided
    if (text) {
        userContent.push({
            type: 'text',
            text: `Here's a list of text that we found in the design:\n${text}`,
        })
    }

    // Add grid details if provided
    if (grid) {
        userContent.push({
            type: 'text',
            text: `The designs have a ${grid.color} grid overlaid on top. Each cell of the grid is ${grid.size}x${grid.size}px.`,
        })
    }

    // Add previous previews to the request
    for (let i = 0; i < previousPreviews.length; i++) {
        const preview = previousPreviews[i]
        userContent.push(
            {
                type: 'text',
                text: `The designs also included one of your previous results. Here's the image that you used as its source:`,
            },
            {
                type: 'text',
                text: `And here's the HTML you came up with for it: ${preview.props.html}`,
            }
        )
    }

    // Add the theme to the request
    userContent.push({
        type: 'text',
        text: `Please make your result use the ${theme} theme.`,
    })

    // Prepare the body of the request to OpenAI API
    const body: GPT4VCompletionRequest = {
        model: 'gpt-4o',
        max_tokens: 4096,
        temperature: 0,
        messages,
        seed: 42,
        n: 1,
    }

    let json = null

    // Send the request to OpenAI API and handle the response
    try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
        })
        json = await resp.json()
    } catch (e: any) {
        throw Error(`Could not contact OpenAI: ${e.message}`)
    }

    return json
}

type MessageContent =
    | string
    | (
        | string
        | {
            type: 'image_url'
            image_url:
                | string
                | {
                    url: string
                    detail: 'low' | 'high' | 'auto'
                }
        }
        | {
            type: 'text'
            text: string
        }
    )[]

export type GPT4VCompletionRequest = {
    model: 'gpt-4o'
    messages: {
        role: 'system' | 'user' | 'assistant' | 'function'
        content: MessageContent
        name?: string | undefined
    }[]
    functions?: any[] | undefined
    function_call?: any | undefined
    stream?: boolean | undefined
    temperature?: number | undefined
    top_p?: number | undefined
    max_tokens?: number | undefined
    n?: number | undefined
    best_of?: number | undefined
    frequency_penalty?: number | undefined
    presence_penalty?: number | undefined
    seed?: number | undefined
    logit_bias?:
        | {
            [x: string]: number
        }
        | undefined
    stop?: (string[] | string) | undefined
}
