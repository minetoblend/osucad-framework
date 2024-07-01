import { KeyBindingAction } from './KeyBindingAction';

export class PlatformAction extends KeyBindingAction {
  constructor(readonly name: string) {
    super();
  }

  static readonly Cut = new PlatformAction('Cut');
  static readonly Copy = new PlatformAction('Copy');
  static readonly Paste = new PlatformAction('Paste');
  static readonly Delete = new PlatformAction('Delete');
  static readonly SelectAll = new PlatformAction('SelectAll');
  static readonly Save = new PlatformAction('Save');
  static readonly Undo = new PlatformAction('Undo');
  static readonly Redo = new PlatformAction('Redo');
  static readonly Exit = new PlatformAction('Exit');
  static readonly MoveToListStart = new PlatformAction('MoveToListStart');
  static readonly MoveToListEnd = new PlatformAction('MoveToListEnd');
  static readonly DocumentNew = new PlatformAction('DocumentNew');
  static readonly DocumentPrevious = new PlatformAction('DocumentPrevious');
  static readonly DocumentNext = new PlatformAction('DocumentNext');
  static readonly DocumentClose = new PlatformAction('DocumentClose');
  static readonly TabNew = new PlatformAction('TabNew');
  static readonly TabRestore = new PlatformAction('TabRestore');

  static readonly MoveBackwardChar = new PlatformAction('MoveBackwardChar');
  static readonly MoveForwardChar = new PlatformAction('MoveForwardChar');
  static readonly DeleteBackwardChar = new PlatformAction('DeleteBackwardChar');
  static readonly DeleteForwardChar = new PlatformAction('DeleteForwardChar');
  static readonly SelectBackwardChar = new PlatformAction('SelectBackwardChar');
  static readonly SelectForwardChar = new PlatformAction('SelectForwardChar');

  static readonly MoveBackwardWord = new PlatformAction('MoveBackwardWord');
  static readonly MoveForwardWord = new PlatformAction('MoveForwardWord');
  static readonly DeleteBackwardWord = new PlatformAction('DeleteBackwardWord');
  static readonly DeleteForwardWord = new PlatformAction('DeleteForwardWord');
  static readonly SelectBackwardWord = new PlatformAction('SelectBackwardWord');
  static readonly SelectForwardWord = new PlatformAction('SelectForwardWord');

  static readonly MoveBackwardLine = new PlatformAction('MoveBackwardLine');
  static readonly MoveForwardLine = new PlatformAction('MoveForwardLine');
  static readonly DeleteBackwardLine = new PlatformAction('DeleteBackwardLine');
  static readonly DeleteForwardLine = new PlatformAction('DeleteForwardLine');
  static readonly SelectBackwardLine = new PlatformAction('SelectBackwardLine');
  static readonly SelectForwardLine = new PlatformAction('SelectForwardLine');

  static readonly ZoomIn = new PlatformAction('ZoomIn');
  static readonly ZoomOut = new PlatformAction('ZoomOut');
  static readonly ZoomDefault = new PlatformAction('ZoomDefault');
}
