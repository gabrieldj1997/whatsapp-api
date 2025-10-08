const fs = require('fs')
const { Poll } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const { sessionFolderPath } = require('../config')
const { sendErrorResponse } = require('../utils')
const { sessions } = require('../sessions')

/**
 * Responds to ping request with 'pong'
 *
 * @function ping
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Promise that resolves once response is sent
 * @throws {Object} - Throws error if response fails
 */
const ping = async (req, res) => {
  /*
    #swagger.tags = ['Various']
  */
  try {
    res.json({ success: true, message: 'pong' })
  } catch (error) {
    sendErrorResponse(res, 500, error.message)
  }
}

/**
 * Example local callback function that generates a QR code and writes a log file
 *
 * @function localCallbackExample
 * @async
 * @param {Object} req - Express request object containing a body object with dataType and data
 * @param {string} req.body.dataType - Type of data (in this case, 'qr')
 * @param {Object} req.body.data - Data to generate a QR code from
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Promise that resolves once response is sent
 * @throws {Object} - Throws error if response fails
 */
const localCallbackExample = async (req, res) => {
  /*
      #swagger.tags = ['Various']
  */
  try {
    const { dataType, data, sessionId } = req.body
    if (dataType === 'qr') {
      qrcode.generate(data.qr, { small: true })
    }
    fs.writeFile(`${sessionFolderPath}/message_log.txt`, `${JSON.stringify(req.body)}\r\n`, { flag: 'a+' }, _ => _)

    if (dataType === 'message' || dataType === 'message_create') {
      const messageData = data.message
      if (messageData.fromMe) {
        return res.json({ success: true, message: 'Sent message ignored.' })
      }
      if (messageData.type === 'chat') {
        const senderId = messageData.from

        // 1. Defina a pergunta e as opções
        const pollName = 'Gostaria de iniciar o cadastro na Comunidade ZDG?'
        const pollOptions = [
          'Sim, por favor!',
          'Dúvidas antes de me cadastrar',
          'Não, obrigado'
        ]

        // 2. Defina as opções da enquete (Single Choice)
        const pollSendOptions = {
          allowMultipleAnswers: false // Garante que o usuário escolha apenas 1 opção
        }

        // 3. Crie o objeto Poll
        const poll = new Poll(pollName, pollOptions, pollSendOptions)

        // 4. Envie a Enquete
        const client = sessions.get(sessionId)
        if (client) {
          await client.sendMessage(senderId, poll)
          console.log(`[${sessionId}] Enviou uma Enquete (Poll) para: ${senderId}`)
        }
      }
    }
    res.json({ success: true, message: 'Callback processed.' })
  } catch (error) {
    console.error('Erro no localCallbackExample:', error)
    fs.writeFile(`${sessionFolderPath}/message_log.txt`, `(ERROR) ${JSON.stringify(error)}\r\n`, { flag: 'a+' }, _ => _)
    sendErrorResponse(res, 500, error.message)
  }
}

module.exports = { ping, localCallbackExample }
