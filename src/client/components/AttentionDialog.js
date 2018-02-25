import React from 'react'
import Dialog from 'material-ui/Dialog'
import { string } from 'prop-types'

const AttentionDialog = ({ title, text }) => (
  <Dialog title={title} modal open>
    {text}
  </Dialog>
)

AttentionDialog.propTypes = {
  title: string.isRequired,
  text: string.isRequired,
}

export default AttentionDialog
